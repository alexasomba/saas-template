import type { CollectionConfig, Config, Endpoint, Plugin, FieldHook } from "payload";

import {
  crmAdminAccess,
  crmCompanyAccess,
  crmCompanyReadAccess,
  crmCompanyWriteAccess,
  crmContactReadAccess,
  crmContactWriteAccess,
  crmDealScopedReadAccess,
  crmDealScopedWriteAccess,
  crmDealWriteAccess,
  crmFinanceAccess,
  crmInvoiceReadAccess,
  crmInvoiceCreateAccess,
  crmInvoiceWriteAccess,
  crmMarketingAccess,
  crmNoteScopedReadAccess,
  crmNoteScopedWriteAccess,
  crmNoteWriteAccess,
  crmQuoteReadAccess,
  crmQuoteCreateAccess,
  crmQuoteWriteAccess,
  crmReadAccess,
  crmTicketScopedReadAccess,
  crmTicketScopedWriteAccess,
  crmTicketWriteAccess,
  crmWriteContactAccess,
} from "@/access/crm";
import { runLifecycleCampaigns } from "./runLifecycleCampaigns";
import { recalculateCRMInvoiceTotals, recalculateCRMQuoteTotals } from "./pricing";
import { runReminderCampaigns } from "./runReminderCampaigns";
import { sendFirstPurchaseCelebrationEmail } from "./sendFirstPurchaseCelebrationEmail";
import {
  CRM_ACTIVITIES_COLLECTION,
  CRM_ACTIVITY_TYPES,
  CRM_COMPANIES_COLLECTION,
  CRM_CONTACTS_COLLECTION,
  CRM_DEALS_COLLECTION,
  CRM_INVOICES_COLLECTION,
  CRM_NOTES_COLLECTION,
  CRM_QUOTES_COLLECTION,
  CRM_SEGMENTS_COLLECTION,
  CRM_TICKETS_COLLECTION,
  CRM_WEBHOOK_EVENTS_COLLECTION,
  DEFAULT_ABANDONED_CART_DELAY_HOURS,
  DEFAULT_WIN_BACK_DELAY_DAYS,
  MARKETING_EVENT_COLLECTION,
} from "./constants";
import {
  syncCartCRMContactAfterChange,
  syncCartCRMContactBeforeChange,
  syncDealCRMActivityAfterChange,
  syncInvoiceCRMActivityAfterChange,
  syncMarketingEventCRMContactAfterChange,
  syncMarketingEventCRMContactBeforeChange,
  syncNoteCRMActivityAfterChange,
  syncOrderCRMContactAfterChange,
  syncOrderCRMContactBeforeChange,
  syncQuoteCRMActivityAfterChange,
  syncTicketCRMActivityAfterChange,
  syncUserCRMContactAfterChange,
  syncUserCRMContactBeforeChange,
} from "./hooks";
import {
  reconcilePaystackInvoices,
  processPaystackInvoiceWebhook,
  syncInvoicePaystackAfterChange,
  syncInvoicePaystackByID,
  verifyPaystackWebhookSignature,
  verifyInvoicePaystackStatusByID,
} from "./paystackInvoices";
import { buildCRMSegmentWhere } from "./crm";
import { createInvoiceFromOrder, createInvoiceFromQuote, createQuoteFromDeal } from "./workflows";

type CRMPluginArgs = {
  abandonedCartDelayHours?: number;
  invoiceDueReminderDays?: number;
  quoteExpiryReminderDays?: number;
  winBackDelayDays?: number;
};

const slugExists = (config: Config, slug: string) =>
  config.collections?.some((collection) => collection.slug === slug);

const appendFieldIfMissing = (
  fields: CollectionConfig["fields"],
  field: NonNullable<CollectionConfig["fields"]>[number],
) => {
  if (!("name" in field) || !field.name) return fields;

  const hasField = fields.some(
    (existingField) => "name" in existingField && existingField.name === field.name,
  );
  return hasField ? fields : [...fields, field];
};

const appendHook = <T extends (...args: never[]) => unknown>(
  existing: T[] | undefined,
  hook: T,
) => {
  if (existing?.includes(hook)) return existing;
  return [...(existing || []), hook];
};

const getRequestUserID = (user: { id?: number | string } | null | undefined) =>
  typeof user?.id === "number" ? user.id : undefined;

const getNumericID = (value: unknown) => {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  return undefined;
};

const parseJSONBody = async (req: Request) => {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const setRelationshipFieldFromUser =
  (): FieldHook =>
  ({ operation, req, value }) => {
    if (operation !== "create" || value) {
      return value;
    }

    const userID = getRequestUserID(req.user);
    return userID ?? value;
  };

const createQuoteFromDealEndpoint = (): Endpoint => ({
  method: "post",
  path: "/crm/quotes/from-deal",
  handler: async (req) => {
    if (!crmDealWriteAccess({ req: req as any })) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJSONBody(req as any);
    const dealID = getNumericID(body.dealID);
    const quoteNumber =
      typeof body.quoteNumber === "string" && body.quoteNumber.trim().length > 0
        ? body.quoteNumber.trim()
        : undefined;

    if (!dealID || !quoteNumber) {
      return Response.json({ error: "dealID and quoteNumber are required" }, { status: 400 });
    }

    const deal = await req.payload.findByID({
      collection: CRM_DEALS_COLLECTION,
      depth: 0,
      id: dealID,
      overrideAccess: false,
      req,
    });

    const quote = await createQuoteFromDeal({
      deal: deal as Parameters<typeof createQuoteFromDeal>[0]["deal"],
      expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : undefined,
      lineItems: Array.isArray(body.lineItems)
        ? (body.lineItems as Parameters<typeof createQuoteFromDeal>[0]["lineItems"])
        : undefined,
      payload: req.payload,
      quoteNumber,
      req: req as any,
    });

    return Response.json(quote);
  },
});

const createInvoiceFromQuoteEndpoint = (): Endpoint => ({
  method: "post",
  path: "/crm/invoices/from-quote",
  handler: async (req) => {
    if (!crmInvoiceCreateAccess({ req: req as any })) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJSONBody(req as any);
    const quoteID = getNumericID(body.quoteID);
    const invoiceNumber =
      typeof body.invoiceNumber === "string" && body.invoiceNumber.trim().length > 0
        ? body.invoiceNumber.trim()
        : undefined;

    if (!quoteID || !invoiceNumber) {
      return Response.json({ error: "quoteID and invoiceNumber are required" }, { status: 400 });
    }

    const quote = await req.payload.findByID({
      collection: CRM_QUOTES_COLLECTION,
      depth: 0,
      id: quoteID,
      overrideAccess: false,
      req,
    });

    const invoice = await createInvoiceFromQuote({
      dueDate: typeof body.dueDate === "string" ? body.dueDate : undefined,
      invoiceNumber,
      payload: req.payload,
      paymentMethod: body.paymentMethod === "bank-transfer" ? "bank-transfer" : "paystack",
      quote: quote as Parameters<typeof createInvoiceFromQuote>[0]["quote"],
      req: req as any,
    });

    return Response.json(invoice);
  },
});

const createInvoiceFromOrderEndpoint = (): Endpoint => ({
  method: "post",
  path: "/crm/invoices/from-order",
  handler: async (req) => {
    if (!crmInvoiceCreateAccess({ req: req as any })) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJSONBody(req as any);
    const orderID = getNumericID(body.orderID);
    const invoiceNumber =
      typeof body.invoiceNumber === "string" && body.invoiceNumber.trim().length > 0
        ? body.invoiceNumber.trim()
        : undefined;

    if (!orderID || !invoiceNumber) {
      return Response.json({ error: "orderID and invoiceNumber are required" }, { status: 400 });
    }

    const order = await req.payload.findByID({
      collection: "orders",
      depth: 0,
      id: orderID,
      overrideAccess: true,
      req,
    });

    const invoice = await createInvoiceFromOrder({
      contactID: getNumericID(body.contactID),
      dueDate: typeof body.dueDate === "string" ? body.dueDate : undefined,
      invoiceNumber,
      order: order as Parameters<typeof createInvoiceFromOrder>[0]["order"],
      payload: req.payload,
      paymentMethod: body.paymentMethod === "bank-transfer" ? "bank-transfer" : "paystack",
      req: req as any,
    });

    return Response.json(invoice);
  },
});

const syncInvoicePaystackEndpoint = (): Endpoint => ({
  method: "post",
  path: "/crm/invoices/paystack/sync",
  handler: async (req) => {
    if (!crmInvoiceWriteAccess({ req: req as any })) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJSONBody(req as any);
    const invoiceID = getNumericID(body.invoiceID);

    if (!invoiceID) {
      return Response.json({ error: "invoiceID is required" }, { status: 400 });
    }

    const invoice = await syncInvoicePaystackByID({
      invoiceID,
      req: req as any,
    });

    return Response.json(invoice);
  },
});

const verifyInvoicePaystackEndpoint = (): Endpoint => ({
  method: "post",
  path: "/crm/invoices/paystack/verify",
  handler: async (req) => {
    if (!crmInvoiceWriteAccess({ req: req as any })) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJSONBody(req as any);
    const invoiceID = getNumericID(body.invoiceID);

    if (!invoiceID) {
      return Response.json({ error: "invoiceID is required" }, { status: 400 });
    }

    const invoice = await verifyInvoicePaystackStatusByID({
      invoiceID,
      req: req as any,
    });

    return Response.json(invoice);
  },
});

const reconcilePaystackInvoicesEndpoint = (): Endpoint => ({
  method: "post",
  path: "/crm/invoices/paystack/reconcile",
  handler: async (req) => {
    if (!crmInvoiceWriteAccess({ req: req as any })) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await reconcilePaystackInvoices({
      payload: req.payload,
      req: req as any,
    });

    return Response.json(summary);
  },
});

const paystackInvoiceWebhookEndpoint = (): Endpoint => ({
  method: "post",
  path: "/crm/invoices/paystack/webhook",
  handler: async (req) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers.get("x-paystack-signature");

    if (!secretKey || !signature) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await (req as any).text();
    if (!verifyPaystackWebhookSignature({ body: rawBody, secretKey, signature })) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let event: Record<string, unknown>;

    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const result = await processPaystackInvoiceWebhook({
      event,
      payload: req.payload,
      req: req as any,
    });

    return Response.json(result);
  },
});

const marketingEventsCollection: CollectionConfig = {
  slug: MARKETING_EVENT_COLLECTION,
  admin: {
    defaultColumns: ["campaign", "recipientEmail", "sentAt"],
    group: "CRM",
    useAsTitle: "dedupeKey",
  },
  access: {
    admin: crmMarketingAccess as any,
    create: crmMarketingAccess,
    delete: crmAdminAccess,
    read: crmMarketingAccess,
    update: crmMarketingAccess,
  },
  hooks: {
    afterChange: [syncMarketingEventCRMContactAfterChange],
    beforeChange: [syncMarketingEventCRMContactBeforeChange],
  },
  fields: [
    {
      name: "campaign",
      type: "select",
      options: [
        {
          label: "Abandoned Cart",
          value: "abandoned-cart",
        },
        {
          label: "First-Time Buyer",
          value: "first-time-buyer",
        },
        {
          label: "Win Back",
          value: "win-back",
        },
        {
          label: "Quote Expiry Reminder",
          value: "quote-expiry-reminder",
        },
        {
          label: "Invoice Due Reminder",
          value: "invoice-due-reminder",
        },
        {
          label: "Invoice Overdue Reminder",
          value: "invoice-overdue-reminder",
        },
      ],
      required: true,
    },
    {
      name: "dedupeKey",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "recipientEmail",
      type: "email",
      index: true,
      required: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
    },
    {
      name: "cart",
      type: "relationship",
      relationTo: "carts",
    },
    {
      name: "sentAt",
      type: "date",
      required: true,
    },
    {
      name: "crmContact",
      type: "relationship",
      relationTo: CRM_CONTACTS_COLLECTION,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};

const crmContactsCollection: CollectionConfig = {
  slug: CRM_CONTACTS_COLLECTION,
  admin: {
    defaultColumns: ["email", "lifecycleStage", "totalOrders", "totalSpend", "lastOrderAt"],
    group: "CRM",
    useAsTitle: "email",
  },
  access: {
    admin: crmContactReadAccess as any,
    create: crmWriteContactAccess,
    delete: crmAdminAccess,
    read: crmContactReadAccess,
    update: crmContactWriteAccess,
  },
  fields: [
    {
      name: "email",
      type: "email",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "name",
      type: "text",
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "company",
      type: "relationship",
      relationTo: CRM_COMPANIES_COLLECTION,
    },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      hooks: {
        beforeChange: [setRelationshipFieldFromUser()],
      },
    },
    {
      name: "accountManager",
      type: "relationship",
      relationTo: "users",
      hooks: {
        beforeChange: [setRelationshipFieldFromUser()],
      },
    },
    {
      name: "paystackCustomerCode",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "marketingOptIn",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "lifecycleStage",
      type: "select",
      defaultValue: "subscriber",
      options: [
        { label: "Subscriber", value: "subscriber" },
        { label: "Lead", value: "lead" },
        { label: "Customer", value: "customer" },
        { label: "Repeat", value: "repeat" },
        { label: "VIP", value: "vip" },
        { label: "Lapsed", value: "lapsed" },
      ],
      required: true,
    },
    {
      name: "tags",
      type: "array",
      fields: [
        {
          name: "tag",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "totalOrders",
      type: "number",
      admin: {
        readOnly: true,
      },
      defaultValue: 0,
    },
    {
      name: "totalSpend",
      type: "number",
      admin: {
        description: "Stored in payment subunits.",
        readOnly: true,
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
      defaultValue: 0,
    },
    {
      name: "firstOrderAt",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "lastOrderAt",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "lastCartAt",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "lastCampaignSentAt",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "orders",
      type: "join",
      collection: "orders",
      on: "crmContact",
      admin: {
        allowCreate: false,
        defaultColumns: ["id", "status", "amount", "createdAt"],
      },
    },
    {
      name: "carts",
      type: "join",
      collection: "carts",
      on: "crmContact",
      admin: {
        allowCreate: false,
        defaultColumns: ["id", "status", "subtotal", "updatedAt"],
      },
    },
    {
      name: "campaignEvents",
      type: "join",
      collection: MARKETING_EVENT_COLLECTION,
      on: "crmContact",
      admin: {
        allowCreate: false,
        defaultColumns: ["campaign", "recipientEmail", "sentAt"],
      },
    },
    {
      name: "activities",
      type: "join",
      collection: CRM_ACTIVITIES_COLLECTION,
      on: "contact",
      admin: {
        allowCreate: false,
        defaultColumns: ["type", "summary", "occurredAt"],
      },
    },
    {
      name: "deals",
      type: "join",
      collection: CRM_DEALS_COLLECTION,
      on: "primaryContact",
      admin: {
        allowCreate: false,
        defaultColumns: ["title", "stage", "value", "expectedCloseDate"],
      },
    },
    {
      name: "quotes",
      type: "join",
      collection: CRM_QUOTES_COLLECTION,
      on: "contact",
      admin: {
        allowCreate: false,
        defaultColumns: ["quoteNumber", "status", "total", "expiresAt"],
      },
    },
    {
      name: "invoices",
      type: "join",
      collection: CRM_INVOICES_COLLECTION,
      on: "contact",
      admin: {
        allowCreate: false,
        defaultColumns: ["invoiceNumber", "status", "total", "dueDate"],
      },
    },
    {
      name: "tickets",
      type: "join",
      collection: CRM_TICKETS_COLLECTION,
      on: "contact",
      admin: {
        allowCreate: false,
        defaultColumns: ["subject", "status", "priority", "updatedAt"],
      },
    },
    {
      name: "notes",
      type: "join",
      collection: CRM_NOTES_COLLECTION,
      on: "contact",
      admin: {
        allowCreate: false,
        defaultColumns: ["subject", "category", "createdAt"],
      },
    },
  ],
  timestamps: true,
};

const crmActivitiesCollection: CollectionConfig = {
  slug: CRM_ACTIVITIES_COLLECTION,
  admin: {
    defaultColumns: ["type", "summary", "occurredAt"],
    group: "CRM",
    useAsTitle: "eventKey",
  },
  access: {
    admin: crmAdminAccess as any,
    create: crmAdminAccess,
    delete: crmAdminAccess,
    read: crmReadAccess as any,
    update: crmAdminAccess,
  },
  fields: [
    {
      name: "eventKey",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "type",
      type: "select",
      options: Object.values(CRM_ACTIVITY_TYPES).map((value) => ({
        label: value,
        value,
      })),
      required: true,
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
    },
    {
      name: "occurredAt",
      type: "date",
      required: true,
    },
    {
      name: "contact",
      type: "relationship",
      relationTo: CRM_CONTACTS_COLLECTION,
      required: true,
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
    },
    {
      name: "cart",
      type: "relationship",
      relationTo: "carts",
    },
    {
      name: "marketingEvent",
      type: "relationship",
      relationTo: MARKETING_EVENT_COLLECTION,
    },
    {
      name: "deal",
      type: "relationship",
      relationTo: CRM_DEALS_COLLECTION,
    },
    {
      name: "ticket",
      type: "relationship",
      relationTo: CRM_TICKETS_COLLECTION,
    },
    {
      name: "note",
      type: "relationship",
      relationTo: CRM_NOTES_COLLECTION,
    },
  ],
  timestamps: true,
};

const crmWebhookEventsCollection: CollectionConfig = {
  slug: CRM_WEBHOOK_EVENTS_COLLECTION,
  admin: {
    defaultColumns: ["provider", "eventKey", "receivedAt"],
    group: "CRM",
    useAsTitle: "eventKey",
  },
  access: {
    admin: crmFinanceAccess as any,
    create: crmAdminAccess,
    delete: crmAdminAccess,
    read: crmFinanceAccess as any,
    update: crmAdminAccess,
  },
  fields: [
    {
      name: "provider",
      type: "text",
      required: true,
    },
    {
      name: "eventKey",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "receivedAt",
      type: "date",
      required: true,
    },
    {
      name: "payload",
      type: "textarea",
      required: true,
    },
  ],
  timestamps: true,
};

const crmCompaniesCollection: CollectionConfig = {
  slug: CRM_COMPANIES_COLLECTION,
  admin: {
    defaultColumns: ["name", "industry", "website", "updatedAt"],
    group: "CRM",
    useAsTitle: "name",
  },
  access: {
    admin: crmCompanyReadAccess as any,
    create: crmCompanyAccess,
    delete: crmAdminAccess,
    read: crmCompanyReadAccess,
    update: crmCompanyWriteAccess,
  },
  fields: [
    {
      name: "name",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "website",
      type: "text",
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "industry",
      type: "text",
    },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      hooks: {
        beforeChange: [setRelationshipFieldFromUser()],
      },
    },
    {
      name: "contacts",
      type: "join",
      collection: CRM_CONTACTS_COLLECTION,
      on: "company",
      admin: {
        allowCreate: false,
        defaultColumns: ["email", "lifecycleStage", "totalSpend"],
      },
    },
    {
      name: "deals",
      type: "join",
      collection: CRM_DEALS_COLLECTION,
      on: "company",
      admin: {
        allowCreate: false,
        defaultColumns: ["title", "stage", "value"],
      },
    },
    {
      name: "quotes",
      type: "join",
      collection: CRM_QUOTES_COLLECTION,
      on: "company",
      admin: {
        allowCreate: false,
        defaultColumns: ["quoteNumber", "status", "total", "expiresAt"],
      },
    },
    {
      name: "invoices",
      type: "join",
      collection: CRM_INVOICES_COLLECTION,
      on: "company",
      admin: {
        allowCreate: false,
        defaultColumns: ["invoiceNumber", "status", "total", "dueDate"],
      },
    },
    {
      name: "tickets",
      type: "join",
      collection: CRM_TICKETS_COLLECTION,
      on: "company",
      admin: {
        allowCreate: false,
        defaultColumns: ["subject", "status", "priority"],
      },
    },
    {
      name: "notes",
      type: "join",
      collection: CRM_NOTES_COLLECTION,
      on: "company",
      admin: {
        allowCreate: false,
        defaultColumns: ["subject", "category", "createdAt"],
      },
    },
  ],
  timestamps: true,
};

const crmDealsCollection: CollectionConfig = {
  slug: CRM_DEALS_COLLECTION,
  admin: {
    components: {
      edit: {
        beforeDocumentControls: ["@/components/crm/AdminWorkflowActions#DealWorkflowActions"],
      },
    },
    defaultColumns: ["title", "stage", "value", "expectedCloseDate"],
    group: "CRM",
    useAsTitle: "title",
  },
  access: {
    admin: crmDealScopedReadAccess as any,
    create: crmDealWriteAccess,
    delete: crmAdminAccess,
    read: crmDealScopedReadAccess,
    update: crmDealScopedWriteAccess,
  },
  hooks: {
    afterChange: [syncDealCRMActivityAfterChange],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "primaryContact",
      type: "relationship",
      relationTo: CRM_CONTACTS_COLLECTION,
      required: true,
    },
    {
      name: "company",
      type: "relationship",
      relationTo: CRM_COMPANIES_COLLECTION,
    },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      hooks: {
        beforeChange: [setRelationshipFieldFromUser()],
      },
    },
    {
      name: "stage",
      type: "select",
      defaultValue: "lead",
      options: [
        { label: "Lead", value: "lead" },
        { label: "Qualified", value: "qualified" },
        { label: "Proposal", value: "proposal" },
        { label: "Negotiation", value: "negotiation" },
        { label: "Won", value: "won" },
        { label: "Lost", value: "lost" },
      ],
      required: true,
    },
    {
      name: "value",
      type: "number",
      defaultValue: 0,
      admin: {
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
    },
    {
      name: "expectedCloseDate",
      type: "date",
    },
    {
      name: "notes",
      type: "textarea",
    },
    {
      name: "crmNotes",
      type: "join",
      collection: CRM_NOTES_COLLECTION,
      on: "deal",
      admin: {
        allowCreate: false,
        defaultColumns: ["subject", "category", "createdAt"],
      },
    },
    {
      name: "quotes",
      type: "join",
      collection: CRM_QUOTES_COLLECTION,
      on: "deal",
      admin: {
        allowCreate: false,
        defaultColumns: ["quoteNumber", "status", "total", "expiresAt"],
      },
    },
  ],
  timestamps: true,
};

const crmQuotesCollection: CollectionConfig = {
  slug: CRM_QUOTES_COLLECTION,
  admin: {
    components: {
      edit: {
        beforeDocumentControls: ["@/components/crm/AdminWorkflowActions#QuoteWorkflowActions"],
      },
    },
    defaultColumns: ["quoteNumber", "status", "total", "expiresAt"],
    group: "CRM",
    useAsTitle: "quoteNumber",
  },
  access: {
    admin: crmQuoteReadAccess as any,
    create: crmQuoteCreateAccess,
    delete: crmAdminAccess,
    read: crmQuoteReadAccess,
    update: crmQuoteWriteAccess,
  },
  hooks: {
    beforeChange: [recalculateCRMQuoteTotals],
    afterChange: [syncQuoteCRMActivityAfterChange],
  },
  fields: [
    {
      name: "quoteNumber",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "contact",
      type: "relationship",
      relationTo: CRM_CONTACTS_COLLECTION,
      required: true,
    },
    {
      name: "company",
      type: "relationship",
      relationTo: CRM_COMPANIES_COLLECTION,
    },
    {
      name: "deal",
      type: "relationship",
      relationTo: CRM_DEALS_COLLECTION,
    },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      hooks: {
        beforeChange: [setRelationshipFieldFromUser()],
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Sent", value: "sent" },
        { label: "Accepted", value: "accepted" },
        { label: "Declined", value: "declined" },
        { label: "Expired", value: "expired" },
      ],
      required: true,
    },
    {
      name: "currency",
      type: "text",
      defaultValue: "NGN",
      required: true,
    },
    {
      name: "subtotal",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
    },
    {
      name: "discount",
      type: "number",
      defaultValue: 0,
      admin: {
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
    },
    {
      name: "tax",
      type: "number",
      defaultValue: 0,
      admin: {
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
    },
    {
      name: "total",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
    },
    {
      name: "expiresAt",
      type: "date",
    },
    {
      name: "sentAt",
      type: "date",
    },
    {
      name: "acceptedAt",
      type: "date",
    },
    {
      name: "lineItems",
      type: "array",
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
        },
        {
          name: "variant",
          type: "relationship",
          relationTo: "variants",
        },
        {
          name: "description",
          type: "text",
        },
        {
          name: "quantity",
          type: "number",
          min: 1,
          required: true,
        },
        {
          name: "unitPrice",
          type: "number",
          min: 0,
          admin: {
            components: {
              Cell: "@/components/crm/CurrencyCell#CurrencyCell",
            },
          },
        },
        {
          name: "lineTotal",
          type: "number",
          admin: {
            readOnly: true,
            components: {
              Cell: "@/components/crm/CurrencyCell#CurrencyCell",
            },
          },
        },
      ],
    },
    {
      name: "notes",
      type: "textarea",
    },
    {
      name: "invoices",
      type: "join",
      collection: CRM_INVOICES_COLLECTION,
      on: "quote",
      admin: {
        allowCreate: false,
        defaultColumns: ["invoiceNumber", "status", "total", "dueDate"],
      },
    },
  ],
  timestamps: true,
};

const crmInvoicesCollection: CollectionConfig = {
  slug: CRM_INVOICES_COLLECTION,
  admin: {
    components: {
      edit: {
        beforeDocumentControls: ["@/components/crm/AdminWorkflowActions#InvoiceWorkflowActions"],
      },
    },
    defaultColumns: ["invoiceNumber", "status", "total", "dueDate"],
    group: "CRM",
    useAsTitle: "invoiceNumber",
  },
  access: {
    admin: crmInvoiceReadAccess as any,
    create: crmInvoiceCreateAccess,
    delete: crmAdminAccess,
    read: crmInvoiceReadAccess,
    update: crmInvoiceWriteAccess,
  },
  hooks: {
    beforeChange: [recalculateCRMInvoiceTotals],
    afterChange: [syncInvoiceCRMActivityAfterChange, syncInvoicePaystackAfterChange],
  },
  fields: [
    {
      name: "invoiceNumber",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "contact",
      type: "relationship",
      relationTo: CRM_CONTACTS_COLLECTION,
      required: true,
    },
    {
      name: "company",
      type: "relationship",
      relationTo: CRM_COMPANIES_COLLECTION,
    },
    {
      name: "quote",
      type: "relationship",
      relationTo: CRM_QUOTES_COLLECTION,
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
    },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      hooks: {
        beforeChange: [setRelationshipFieldFromUser()],
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Issued", value: "issued" },
        { label: "Partially Paid", value: "partially_paid" },
        { label: "Paid", value: "paid" },
        { label: "Overdue", value: "overdue" },
        { label: "Void", value: "void" },
      ],
      required: true,
    },
    {
      name: "currency",
      type: "text",
      defaultValue: "NGN",
      required: true,
    },
    {
      name: "subtotal",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
    },
    {
      name: "tax",
      type: "number",
      defaultValue: 0,
      admin: {
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
    },
    {
      name: "total",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
    },
    {
      name: "balanceDue",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        components: {
          Cell: "@/components/crm/CurrencyCell#CurrencyCell",
        },
      },
    },
    {
      name: "issueDate",
      type: "date",
    },
    {
      name: "dueDate",
      type: "date",
    },
    {
      name: "paidAt",
      type: "date",
    },
    {
      name: "paymentMethod",
      type: "select",
      defaultValue: "paystack",
      options: [
        { label: "Paystack", value: "paystack" },
        { label: "Bank Transfer", value: "bank-transfer" },
      ],
      required: true,
    },
    {
      name: "paystack",
      type: "group",
      admin: {
        condition: (_, siblingData) => siblingData?.paymentMethod === "paystack",
      },
      fields: [
        {
          name: "customerCode",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "paymentRequestID",
          type: "number",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "requestCode",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "paymentRequestStatus",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "offlineReference",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "pdfURL",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "lastSyncedAt",
          type: "date",
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: "bankTransferInstructions",
      type: "group",
      admin: {
        condition: (_, siblingData) => siblingData?.paymentMethod === "bank-transfer",
      },
      fields: [
        {
          name: "accountName",
          type: "text",
        },
        {
          name: "accountNumber",
          type: "text",
        },
        {
          name: "bankName",
          type: "text",
        },
        {
          name: "reference",
          type: "text",
        },
        {
          name: "notes",
          type: "textarea",
        },
      ],
    },
    {
      name: "lineItems",
      type: "array",
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
        },
        {
          name: "variant",
          type: "relationship",
          relationTo: "variants",
        },
        {
          name: "description",
          type: "text",
        },
        {
          name: "quantity",
          type: "number",
          min: 1,
          required: true,
        },
        {
          name: "unitPrice",
          type: "number",
          min: 0,
          admin: {
            components: {
              Cell: "@/components/crm/CurrencyCell#CurrencyCell",
            },
          },
        },
        {
          name: "lineTotal",
          type: "number",
          admin: {
            readOnly: true,
            components: {
              Cell: "@/components/crm/CurrencyCell#CurrencyCell",
            },
          },
        },
      ],
    },
    {
      name: "notes",
      type: "textarea",
    },
  ],
  timestamps: true,
};

const crmTicketsCollection: CollectionConfig = {
  slug: CRM_TICKETS_COLLECTION,
  admin: {
    defaultColumns: ["subject", "status", "priority", "updatedAt"],
    group: "CRM",
    useAsTitle: "subject",
  },
  access: {
    admin: crmTicketScopedReadAccess as any,
    create: crmTicketWriteAccess,
    delete: crmAdminAccess,
    read: crmTicketScopedReadAccess,
    update: crmTicketScopedWriteAccess,
  },
  hooks: {
    afterChange: [syncTicketCRMActivityAfterChange],
  },
  fields: [
    {
      name: "subject",
      type: "text",
      required: true,
    },
    {
      name: "contact",
      type: "relationship",
      relationTo: CRM_CONTACTS_COLLECTION,
      required: true,
    },
    {
      name: "company",
      type: "relationship",
      relationTo: CRM_COMPANIES_COLLECTION,
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
    },
    {
      name: "assignee",
      type: "relationship",
      relationTo: "users",
      hooks: {
        beforeChange: [setRelationshipFieldFromUser()],
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "open",
      options: [
        { label: "Open", value: "open" },
        { label: "In Progress", value: "in_progress" },
        { label: "Waiting on Customer", value: "waiting_on_customer" },
        { label: "Resolved", value: "resolved" },
        { label: "Closed", value: "closed" },
      ],
      required: true,
    },
    {
      name: "priority",
      type: "select",
      defaultValue: "medium",
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
        { label: "Urgent", value: "urgent" },
      ],
      required: true,
    },
    {
      name: "channel",
      type: "select",
      defaultValue: "web",
      options: [
        { label: "Web", value: "web" },
        { label: "Email", value: "email" },
        { label: "Phone", value: "phone" },
        { label: "Chat", value: "chat" },
      ],
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      name: "resolution",
      type: "textarea",
    },
    {
      name: "notes",
      type: "join",
      collection: CRM_NOTES_COLLECTION,
      on: "ticket",
      admin: {
        allowCreate: false,
        defaultColumns: ["subject", "category", "createdAt"],
      },
    },
  ],
  timestamps: true,
};

const crmNotesCollection: CollectionConfig = {
  slug: CRM_NOTES_COLLECTION,
  admin: {
    defaultColumns: ["subject", "category", "author", "createdAt"],
    group: "CRM",
    useAsTitle: "subject",
  },
  access: {
    admin: crmNoteScopedReadAccess,
    create: crmNoteWriteAccess,
    delete: crmAdminAccess,
    read: crmNoteScopedReadAccess,
    update: crmNoteScopedWriteAccess,
  },
  hooks: {
    afterChange: [syncNoteCRMActivityAfterChange],
  },
  fields: [
    {
      name: "subject",
      type: "text",
      required: true,
    },
    {
      name: "category",
      type: "select",
      defaultValue: "internal",
      options: [
        { label: "Internal", value: "internal" },
        { label: "Sales", value: "sales" },
        { label: "Support", value: "support" },
        { label: "Customer", value: "customer" },
      ],
      required: true,
    },
    {
      name: "body",
      type: "textarea",
      required: true,
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      hooks: {
        beforeChange: [setRelationshipFieldFromUser()],
      },
    },
    {
      name: "contact",
      type: "relationship",
      relationTo: CRM_CONTACTS_COLLECTION,
    },
    {
      name: "company",
      type: "relationship",
      relationTo: CRM_COMPANIES_COLLECTION,
    },
    {
      name: "deal",
      type: "relationship",
      relationTo: CRM_DEALS_COLLECTION,
    },
    {
      name: "ticket",
      type: "relationship",
      relationTo: CRM_TICKETS_COLLECTION,
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
    },
  ],
  timestamps: true,
};

const crmSegmentsCollection: CollectionConfig = {
  slug: CRM_SEGMENTS_COLLECTION,
  admin: {
    defaultColumns: ["name", "estimatedContacts", "updatedAt"],
    group: "CRM",
    useAsTitle: "name",
  },
  access: {
    admin: crmMarketingAccess as any,
    create: crmMarketingAccess,
    delete: crmAdminAccess,
    read: crmMarketingAccess,
    update: crmMarketingAccess,
  },
  fields: [
    {
      name: "name",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "marketingOptInOnly",
      type: "checkbox",
      defaultValue: false,
      label: "Only include marketing-opted-in contacts",
    },
    {
      name: "lifecycleStages",
      type: "array",
      fields: [
        {
          name: "value",
          type: "select",
          options: [
            { label: "Subscriber", value: "subscriber" },
            { label: "Lead", value: "lead" },
            { label: "Customer", value: "customer" },
            { label: "Repeat", value: "repeat" },
            { label: "VIP", value: "vip" },
            { label: "Lapsed", value: "lapsed" },
          ],
          required: true,
        },
      ],
    },
    {
      name: "minimumTotalOrders",
      type: "number",
      min: 0,
    },
    {
      name: "minimumTotalSpend",
      type: "number",
      min: 0,
    },
    {
      name: "lastOrderBeforeDays",
      type: "number",
      min: 1,
      label: "Last order older than N days",
    },
    {
      name: "tags",
      type: "array",
      fields: [
        {
          name: "tag",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "estimatedContacts",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Stored estimate of how many CRM contacts match this segment.",
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const where = buildCRMSegmentWhere(data || {});
        const result = await req.payload.find({
          collection: CRM_CONTACTS_COLLECTION,
          limit: 1,
          overrideAccess: true,
          req,
          where,
        });

        return {
          ...data,
          estimatedContacts: result.totalDocs,
        };
      },
    ],
  },
  timestamps: true,
};

export const crmPlugin =
  ({
    abandonedCartDelayHours = DEFAULT_ABANDONED_CART_DELAY_HOURS,
    invoiceDueReminderDays = 3,
    quoteExpiryReminderDays = 3,
    winBackDelayDays = DEFAULT_WIN_BACK_DELAY_DAYS,
  }: CRMPluginArgs = {}): Plugin =>
  (incomingConfig) => {
    const config = { ...incomingConfig };

    config.collections = [...(config.collections || [])];

    if (!slugExists(config, MARKETING_EVENT_COLLECTION)) {
      config.collections.push(marketingEventsCollection);
    }
    if (!slugExists(config, CRM_CONTACTS_COLLECTION)) {
      config.collections.push(crmContactsCollection);
    }
    if (!slugExists(config, CRM_ACTIVITIES_COLLECTION)) {
      config.collections.push(crmActivitiesCollection);
    }
    if (!slugExists(config, CRM_WEBHOOK_EVENTS_COLLECTION)) {
      config.collections.push(crmWebhookEventsCollection);
    }
    if (!slugExists(config, CRM_COMPANIES_COLLECTION)) {
      config.collections.push(crmCompaniesCollection);
    }
    if (!slugExists(config, CRM_DEALS_COLLECTION)) {
      config.collections.push(crmDealsCollection);
    }
    if (!slugExists(config, CRM_QUOTES_COLLECTION)) {
      config.collections.push(crmQuotesCollection);
    }
    if (!slugExists(config, CRM_INVOICES_COLLECTION)) {
      config.collections.push(crmInvoicesCollection);
    }
    if (!slugExists(config, CRM_NOTES_COLLECTION)) {
      config.collections.push(crmNotesCollection);
    }
    if (!slugExists(config, CRM_SEGMENTS_COLLECTION)) {
      config.collections.push(crmSegmentsCollection);
    }
    if (!slugExists(config, CRM_TICKETS_COLLECTION)) {
      config.collections.push(crmTicketsCollection);
    }

    config.collections = config.collections.map((collection) => {
      if (collection.slug === "users") {
        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: appendHook(collection.hooks?.afterChange, syncUserCRMContactAfterChange),
            beforeChange: appendHook(
              collection.hooks?.beforeChange,
              syncUserCRMContactBeforeChange,
            ),
          },
          fields: appendFieldIfMissing(
            appendFieldIfMissing(collection.fields, {
              name: "marketingOptIn",
              type: "checkbox",
              defaultValue: false,
              label: "Email marketing opt-in",
            }),
            {
              name: "crmContact",
              type: "relationship",
              index: false,
              relationTo: CRM_CONTACTS_COLLECTION,
              admin: {
                position: "sidebar",
                readOnly: true,
              },
            },
          ),
        };
      }

      if (collection.slug === "carts") {
        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: appendHook(collection.hooks?.afterChange, syncCartCRMContactAfterChange),
            beforeChange: appendHook(
              collection.hooks?.beforeChange,
              syncCartCRMContactBeforeChange,
            ),
          },
          fields: appendFieldIfMissing(
            appendFieldIfMissing(
              appendFieldIfMissing(collection.fields, {
                name: "customerEmail",
                type: "email",
                admin: {
                  position: "sidebar",
                },
              }),
              {
                name: "marketingOptIn",
                type: "checkbox",
                defaultValue: false,
                admin: {
                  position: "sidebar",
                },
              },
            ),
            {
              name: "crmContact",
              type: "relationship",
              index: false,
              relationTo: CRM_CONTACTS_COLLECTION,
              admin: {
                position: "sidebar",
                readOnly: true,
              },
            },
          ),
        };
      }

      if (collection.slug === "orders") {
        return {
          ...collection,
          admin: {
            ...collection.admin,
            components: {
              ...collection.admin?.components,
              edit: {
                ...collection.admin?.components?.edit,
                beforeDocumentControls: [
                  ...(collection.admin?.components?.edit?.beforeDocumentControls || []),
                  "@/components/crm/AdminWorkflowActions#OrderWorkflowActions",
                ],
              },
            },
          },
          hooks: {
            ...collection.hooks,
            afterChange: appendHook(
              appendHook(collection.hooks?.afterChange, sendFirstPurchaseCelebrationEmail),
              syncOrderCRMContactAfterChange,
            ),
            beforeChange: appendHook(
              collection.hooks?.beforeChange,
              syncOrderCRMContactBeforeChange,
            ),
          },
          fields: appendFieldIfMissing(collection.fields, {
            name: "crmContact",
            type: "relationship",
            index: false,
            relationTo: CRM_CONTACTS_COLLECTION,
            admin: {
              position: "sidebar",
              readOnly: true,
            },
          }),
        };
      }

      if (collection.slug === MARKETING_EVENT_COLLECTION) {
        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: appendHook(
              collection.hooks?.afterChange,
              syncMarketingEventCRMContactAfterChange,
            ),
            beforeChange: appendHook(
              collection.hooks?.beforeChange,
              syncMarketingEventCRMContactBeforeChange,
            ),
          },
        };
      }

      return collection;
    });

    config.endpoints = [
      ...(config.endpoints || []),
      createQuoteFromDealEndpoint(),
      createInvoiceFromQuoteEndpoint(),
      createInvoiceFromOrderEndpoint(),
      paystackInvoiceWebhookEndpoint(),
      reconcilePaystackInvoicesEndpoint(),
      syncInvoicePaystackEndpoint(),
      verifyInvoicePaystackEndpoint(),
    ];

    config.jobs = {
      ...(config.jobs || {}),
      tasks: [
        ...(config.jobs?.tasks || []),
        {
          slug: "runLifecycleCampaigns",
          label: "Run lifecycle campaigns",
          schedule: [
            {
              cron: "0 0 * * * *",
              queue: "marketing",
            },
          ],
          handler: async ({ req }) => {
            const output = await runLifecycleCampaigns({
              abandonedCartDelayHours,
              now: new Date(),
              payload: req.payload,
              req,
              winBackDelayDays,
            });

            return {
              output,
              state: "succeeded",
            };
          },
        },
        {
          slug: "reconcilePaystackInvoices",
          label: "Reconcile Paystack invoices",
          schedule: [
            {
              cron: "0 15 * * * *",
              queue: "finance",
            },
          ],
          handler: async ({ req }) => {
            const output = await reconcilePaystackInvoices({
              payload: req.payload,
              req,
            });

            return {
              output,
              state: "succeeded",
            };
          },
        },
        {
          slug: "runCRMReminders",
          label: "Run CRM reminders",
          schedule: [
            {
              cron: "0 30 8 * * *",
              queue: "marketing",
            },
          ],
          handler: async ({ req }) => {
            const output = await runReminderCampaigns({
              invoiceDueReminderDays,
              now: new Date(),
              payload: req.payload,
              quoteExpiryReminderDays,
              req,
            });

            return {
              output,
              state: "succeeded",
            };
          },
        },
      ],
    };

    return config;
  };
