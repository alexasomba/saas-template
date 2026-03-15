import type { Payload, PayloadRequest } from "payload";

import { CRM_INVOICES_COLLECTION, CRM_QUOTES_COLLECTION } from "./constants";

type RelationshipValue = number | { id?: number | null } | null | undefined;

type QuoteLineItemInput = {
  description?: string;
  lineTotal?: number;
  product?: number;
  quantity?: number;
  unitPrice?: number;
  variant?: number;
};

type DealLike = {
  company?: RelationshipValue;
  id: number;
  notes?: string | null;
  owner?: RelationshipValue;
  primaryContact?: RelationshipValue;
  title?: string | null;
  value?: number | null;
};

type QuoteLike = {
  company?: RelationshipValue;
  contact?: RelationshipValue;
  currency?: string | null;
  deal?: RelationshipValue;
  id: number;
  lineItems?: QuoteLineItemInput[] | null;
  notes?: string | null;
  owner?: RelationshipValue;
  total?: number | null;
};

type OrderLike = {
  contact?: {
    email?: string | null;
  } | null;
  crmContact?: RelationshipValue;
  currency?: string | null;
  customerEmail?: string | null;
  id: number;
  items?:
    | {
        product?: RelationshipValue;
        quantity?: number | null;
        variant?: RelationshipValue;
      }[]
    | null;
  amount?: number | null;
};

type CreateQuoteFromDealArgs = {
  deal: DealLike;
  expiresAt?: string;
  lineItems?: QuoteLineItemInput[];
  payload: Payload;
  quoteNumber: string;
  req?: PayloadRequest;
};

type CreateInvoiceFromQuoteArgs = {
  dueDate?: string;
  invoiceNumber: string;
  payload: Payload;
  paymentMethod?: "bank-transfer" | "paystack";
  quote: QuoteLike;
  req?: PayloadRequest;
};

type CreateInvoiceFromOrderArgs = {
  contactID?: number;
  dueDate?: string;
  invoiceNumber: string;
  order: OrderLike;
  payload: Payload;
  paymentMethod?: "bank-transfer" | "paystack";
  req?: PayloadRequest;
};

const getRelationshipID = (value: RelationshipValue) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && typeof value.id === "number") return value.id;
  return undefined;
};

const internalAccessArgs = (req?: PayloadRequest) => ({
  overrideAccess: true as const,
  ...(req ? { req } : {}),
});

const normalizeLineItems = (lineItems: QuoteLineItemInput[] | undefined) =>
  (lineItems || []).map((item) => ({
    ...(typeof item.description === "string" ? { description: item.description } : {}),
    ...(typeof item.lineTotal === "number" ? { lineTotal: item.lineTotal } : {}),
    ...(typeof item.product === "number" ? { product: item.product } : {}),
    quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
    ...(typeof item.unitPrice === "number" ? { unitPrice: item.unitPrice } : {}),
    ...(typeof item.variant === "number" ? { variant: item.variant } : {}),
  }));

export const createQuoteFromDeal = async ({
  deal,
  expiresAt,
  lineItems,
  payload,
  quoteNumber,
  req,
}: CreateQuoteFromDealArgs) => {
  const fallbackLineItems =
    lineItems ||
    (typeof deal.value === "number" && deal.value > 0
      ? [
          {
            description: deal.title || `Deal ${deal.id}`,
            quantity: 1,
            unitPrice: deal.value,
          },
        ]
      : []);

  return payload.create({
    collection: CRM_QUOTES_COLLECTION,
    data: {
      company: getRelationshipID(deal.company),
      contact: getRelationshipID(deal.primaryContact),
      currency: "NGN",
      deal: deal.id,
      expiresAt,
      lineItems: normalizeLineItems(fallbackLineItems),
      notes: deal.notes || undefined,
      owner: getRelationshipID(deal.owner),
      quoteNumber,
      status: "draft",
    } as any,
    ...internalAccessArgs(req),
  });
};

export const createInvoiceFromQuote = async ({
  dueDate,
  invoiceNumber,
  payload,
  paymentMethod = "paystack",
  quote,
  req,
}: CreateInvoiceFromQuoteArgs) =>
  payload.create({
    collection: CRM_INVOICES_COLLECTION,
    data: {
      company: getRelationshipID(quote.company),
      contact: getRelationshipID(quote.contact),
      currency: quote.currency || "NGN",
      dueDate,
      lineItems: normalizeLineItems(quote.lineItems || undefined),
      notes: quote.notes || undefined,
      owner: getRelationshipID(quote.owner),
      paymentMethod,
      quote: quote.id,
      invoiceNumber,
      status: "issued",
    } as any,
    ...internalAccessArgs(req),
  });

export const createInvoiceFromOrder = async ({
  contactID,
  dueDate,
  invoiceNumber,
  order,
  payload,
  paymentMethod = "paystack",
  req,
}: CreateInvoiceFromOrderArgs) => {
  const resolvedContactID = contactID || getRelationshipID(order.crmContact);

  if (!resolvedContactID) {
    throw new Error("A CRM contact is required to generate an invoice from an order.");
  }

  return payload.create({
    collection: CRM_INVOICES_COLLECTION,
    data: {
      contact: resolvedContactID,
      currency: order.currency || "NGN",
      dueDate,
      lineItems: (order.items || []).map((item) => ({
        ...(typeof getRelationshipID(item.product) === "number"
          ? { product: getRelationshipID(item.product) }
          : {}),
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
        ...(typeof getRelationshipID(item.variant) === "number"
          ? { variant: getRelationshipID(item.variant) }
          : {}),
      })),
      paymentMethod,
      order: order.id,
      invoiceNumber,
      status: "issued",
      ...(typeof order.amount === "number"
        ? { total: order.amount, balanceDue: order.amount }
        : {}),
    } as any,
    ...internalAccessArgs(req),
  });
};
