import type { CollectionBeforeChangeHook } from "payload";

import type { Product, Variant } from "@/payload-types";

type PriceLookupDoc = Partial<Product & Variant> & Record<string, unknown>;

const readCurrencyPrice = (doc: PriceLookupDoc | null | undefined, priceField: string): number => {
  if (!doc) return 0;

  const price = doc[priceField];
  return typeof price === "number" ? price : 0;
};

const getRelationshipID = (value: unknown) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "number") {
    return value.id;
  }
  return undefined;
};

const getTitle = (value: unknown) => {
  if (value && typeof value === "object" && "title" in value && typeof value.title === "string") {
    return value.title;
  }
  return undefined;
};

const getPriceField = (currency?: unknown) => `priceIn${String(currency || "NGN").toUpperCase()}`;

const resolveReferencedDocs = async ({
  item,
  payload,
  req,
}: {
  item: Record<string, unknown>;
  payload: NonNullable<Parameters<CollectionBeforeChangeHook>[0]["req"]>["payload"];
  req: Parameters<CollectionBeforeChangeHook>[0]["req"];
}) => {
  const variantID = getRelationshipID(item.variant);
  const variantDoc =
    variantID && typeof item.variant !== "object"
      ? ((await payload.findByID({
          collection: "variants",
          id: variantID,
          depth: 0,
          req,
        })) as PriceLookupDoc)
      : ((typeof item.variant === "object" ? item.variant : undefined) as
          | PriceLookupDoc
          | undefined);

  const productID = getRelationshipID(item.product);
  const productDoc =
    productID && typeof item.product !== "object"
      ? ((await payload.findByID({
          collection: "products",
          id: productID,
          depth: 0,
          req,
        })) as PriceLookupDoc)
      : ((typeof item.product === "object" ? item.product : undefined) as
          | PriceLookupDoc
          | undefined);

  return { productDoc, variantDoc };
};

const resolveUnitPrice = ({
  item,
  priceField,
  productDoc,
  variantDoc,
}: {
  item: Record<string, unknown>;
  priceField: string;
  productDoc?: PriceLookupDoc;
  variantDoc?: PriceLookupDoc;
}) => {
  if (typeof item.unitPrice === "number") {
    return item.unitPrice;
  }

  if (variantDoc) {
    const variantPrice = readCurrencyPrice(variantDoc as PriceLookupDoc, priceField);
    if (variantPrice > 0) {
      return variantPrice;
    }
  }

  if (productDoc) {
    return readCurrencyPrice(productDoc as PriceLookupDoc, priceField);
  }

  return 0;
};

const resolveDescription = (
  item: Record<string, unknown>,
  {
    productDoc,
    variantDoc,
  }: {
    productDoc?: PriceLookupDoc;
    variantDoc?: PriceLookupDoc;
  },
) => {
  if (typeof item.description === "string" && item.description.trim().length > 0) {
    return item.description.trim();
  }

  const variantTitle = getTitle(variantDoc) || getTitle(item.variant);
  if (variantTitle) return variantTitle;

  const productTitle = getTitle(productDoc) || getTitle(item.product);
  if (productTitle) return productTitle;

  return "";
};

const normalizeMoney = (value: number) => Math.round(value * 100) / 100;

const recalculateCommerceDocumentTotals: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const payload = req.payload;
  const currency = data?.currency ?? originalDoc?.currency ?? "NGN";
  const discount =
    typeof data?.discount === "number"
      ? data.discount
      : typeof originalDoc?.discount === "number"
        ? originalDoc.discount
        : 0;
  const tax =
    typeof data?.tax === "number"
      ? data.tax
      : typeof originalDoc?.tax === "number"
        ? originalDoc.tax
        : 0;
  const explicitBalanceDue =
    typeof data?.balanceDue === "number"
      ? data.balanceDue
      : typeof originalDoc?.balanceDue === "number"
        ? originalDoc.balanceDue
        : undefined;

  const priceField = getPriceField(currency);
  const sourceItems = Array.isArray(data?.lineItems)
    ? data.lineItems
    : Array.isArray(originalDoc?.lineItems)
      ? originalDoc.lineItems
      : [];

  const lineItems = await Promise.all(
    sourceItems.map(async (rawItem: any) => {
      const item = (rawItem || {}) as Record<string, unknown>;
      const quantity = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
      const referencedDocs = await resolveReferencedDocs({
        item,
        payload,
        req,
      });
      const unitPrice = resolveUnitPrice({
        item,
        priceField,
        ...referencedDocs,
      });
      const lineTotal = normalizeMoney(unitPrice * quantity);

      return {
        ...item,
        description: resolveDescription(item, referencedDocs),
        lineTotal,
        quantity,
        unitPrice,
      };
    }),
  );

  const subtotal = normalizeMoney(
    lineItems.reduce(
      (sum, item) => sum + (typeof item.lineTotal === "number" ? item.lineTotal : 0),
      0,
    ),
  );
  const total = normalizeMoney(Math.max(subtotal - discount + tax, 0));
  const balanceDue =
    typeof explicitBalanceDue === "number" ? normalizeMoney(explicitBalanceDue) : total;

  return {
    ...data,
    balanceDue,
    currency,
    discount,
    lineItems,
    subtotal,
    tax,
    total,
  };
};

export const recalculateCRMQuoteTotals = recalculateCommerceDocumentTotals;
export const recalculateCRMInvoiceTotals = recalculateCommerceDocumentTotals;
