import { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";
import { CollectionBeforeChangeHook } from "payload";
import type { Product, Variant } from "@/payload-types";
import { getEffectiveUnitPrice } from "@/utilities/ecommerce/pricing";

type PriceLookupDoc = Partial<Product & Variant> & Record<string, unknown>;

const recalculateSubtotal: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const items = data?.items ?? originalDoc?.items;
  const currency = data?.currency ?? originalDoc?.currency;
  const payload = req.payload;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      ...data,
      subtotal: 0,
    };
  }

  let subtotal = 0;
  let taxTotal = 0;
  const activeCurrency = currency || "NGN";

  for (const item of items) {
    const { product, variant, quantity } = item;
    if (!product || !quantity) continue;

    let unitPrice = 0;
    let productDoc: PriceLookupDoc | null | undefined = null;

    // 1. Check variant price first if applicable
    if (variant) {
      const variantDoc =
        typeof variant === "object"
          ? (variant as PriceLookupDoc)
          : await payload.findByID({
              collection: "variants",
              id: variant,
              depth: 0,
              req,
            });
      unitPrice =
        getEffectiveUnitPrice({
          currencyCode: activeCurrency,
          variant: variantDoc as PriceLookupDoc | null | undefined,
        }) ?? 0;
    }

    // 2. Fallback to product price if no variant price found
    const fetchedProductDoc =
      typeof product === "object"
        ? (product as PriceLookupDoc)
        : await payload.findByID({
            collection: "products",
            id: product,
            depth: 0,
            req,
          });

    productDoc = fetchedProductDoc as PriceLookupDoc | null | undefined;

    if (unitPrice === 0) {
      unitPrice =
        getEffectiveUnitPrice({
          currencyCode: activeCurrency,
          product: productDoc,
        }) ?? 0;
    }

    subtotal += unitPrice * quantity;

    // Calculate Tax for item
    if (productDoc?.taxStatus === "taxable") {
      let rate = 7.5; // Default standard rate
      if (productDoc.taxClass) {
        try {
          const taxClassDoc =
            typeof productDoc.taxClass === "object"
              ? productDoc.taxClass
              : await payload.findByID({
                  collection: "tax-classes",
                  id: productDoc.taxClass,
                  depth: 0,
                  req,
                });

          if (taxClassDoc && typeof (taxClassDoc as any).rate === "number") {
            rate = (taxClassDoc as any).rate;
          }
        } catch (e) {
          req.payload.logger.error(`Error fetching tax class: ${e}`);
        }
      }
      taxTotal += (unitPrice * quantity * rate) / 100;
    }
  }

  // Calculate tax on shipping (assume taxable down the line if items are taxable)
  const shippingTotal = data?.shippingTotal || originalDoc?.shippingTotal || 0;
  if (shippingTotal > 0 && taxTotal > 0) {
    // Calculate standard 7.5% tax on shipping if cart has taxable items
    taxTotal += (shippingTotal * 7.5) / 100;
  }

  const finalSubtotal = Math.round(subtotal * 100) / 100;
  const finalTaxTotal = Math.round(taxTotal * 100) / 100;

  return {
    ...data,
    currency: activeCurrency,
    subtotal: finalSubtotal,
    taxTotal: finalTaxTotal,
    shippingTotal,
  };
};

import { Field } from "payload";

const addonSelectionsField: Field = {
  name: "addonSelections",
  type: "array",
  admin: {
    description: "Add-on options selected by the customer.",
  },
  fields: [
    { name: "fieldId", type: "text", required: true },
    { name: "label", type: "text", required: true },
    { name: "value", type: "text", required: true },
    { name: "priceAdjustment", type: "number", defaultValue: 0 },
    { name: "priceAdjustmentNGN", type: "number", defaultValue: 0 },
  ],
};

export const CartsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: [
    ...defaultCollection.fields.map((field) => {
      if ("name" in field && field.name === "items" && field.type === "array") {
        return {
          ...field,
          fields: [...field.fields, addonSelectionsField],
        };
      }
      return field;
    }),
    {
      name: "shippingMethod",
      type: "text",
      admin: {
        description: "Selected shipping method (if any).",
      },
    },
    {
      name: "shippingTotal",
      type: "number",
      admin: {
        description: "Calculated shipping total.",
      },
    },
    {
      name: "taxTotal",
      type: "number",
      admin: {
        description: "Calculated tax total.",
      },
    },
  ],
  hooks: {
    ...defaultCollection?.hooks,
    beforeChange: [...(defaultCollection?.hooks?.beforeChange || []), recalculateSubtotal],
  },
});
