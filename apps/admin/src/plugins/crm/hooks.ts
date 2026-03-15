import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from "payload";

import { CRM_ACTIVITY_TYPES } from "./constants";
import {
  createUserSyncedActivity,
  ensureCRMContact,
  normalizeEmail,
  recalculateCRMContactStats,
  recordCRMActivity,
  resolveCRMActivityContactID,
} from "./crm";

const getUserID = (value: unknown) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "number") {
    return value.id;
  }
  return undefined;
};

const getName = (firstName?: string | null, lastName?: string | null) =>
  [firstName, lastName].filter(Boolean).join(" ").trim() || undefined;

export const syncUserCRMContactBeforeChange: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data?.email || typeof data.email !== "string") return data;

  const contact = await ensureCRMContact({
    email: data.email,
    marketingOptIn: typeof data.marketingOptIn === "boolean" ? data.marketingOptIn : undefined,
    name: typeof data.name === "string" ? data.name : undefined,
    payload: req.payload,
    req,
  });

  return {
    ...data,
    crmContact: contact.id,
  };
};

export const syncUserCRMContactAfterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!doc?.email) return doc;

  const contact = await ensureCRMContact({
    email: doc.email,
    marketingOptIn: typeof doc.marketingOptIn === "boolean" ? doc.marketingOptIn : undefined,
    name: typeof doc.name === "string" ? doc.name : undefined,
    payload: req.payload,
    req,
    userID: doc.id,
  });

  await createUserSyncedActivity({
    contactID: contact.id,
    email: doc.email,
    payload: req.payload,
    req,
  });

  return doc;
};

export const syncCartCRMContactBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const email =
    (typeof data?.customerEmail === "string" ? data.customerEmail : undefined) ||
    (typeof originalDoc?.customerEmail === "string" ? originalDoc.customerEmail : undefined);

  if (!email) return data;

  const contact = await ensureCRMContact({
    email,
    lastCartAt: new Date().toISOString(),
    marketingOptIn:
      typeof data?.marketingOptIn === "boolean"
        ? data.marketingOptIn
        : typeof originalDoc?.marketingOptIn === "boolean"
          ? originalDoc.marketingOptIn
          : undefined,
    payload: req.payload,
    req,
    userID:
      getUserID(data?.customer) ||
      getUserID(originalDoc?.customer) ||
      (req.user?.email && normalizeEmail(req.user.email) === normalizeEmail(email)
        ? req.user.id
        : undefined),
  });

  return {
    ...data,
    crmContact: contact.id,
  };
};

export const syncCartCRMContactAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const contactID = typeof doc.crmContact === "object" ? doc.crmContact?.id : doc.crmContact;
  const recipientEmail = doc.customerEmail;

  if (!contactID || !recipientEmail) return doc;

  const becameIdentified = !previousDoc?.customerEmail && operation === "update";

  if (operation === "create" || becameIdentified) {
    await recordCRMActivity({
      cartID: doc.id,
      contactID,
      eventKey: `${CRM_ACTIVITY_TYPES.cartIdentified}:${doc.id}`,
      occurredAt: doc.updatedAt,
      payload: req.payload,
      req,
      summary: `Cart #${doc.id} was identified for ${recipientEmail}.`,
      type: CRM_ACTIVITY_TYPES.cartIdentified,
    });
  }

  return doc;
};

export const syncOrderCRMContactBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const email =
    (typeof data?.customerEmail === "string" ? data.customerEmail : undefined) ||
    (typeof data?.contact?.email === "string" ? data.contact.email : undefined) ||
    (typeof originalDoc?.customerEmail === "string" ? originalDoc.customerEmail : undefined) ||
    (typeof originalDoc?.contact?.email === "string" ? originalDoc.contact.email : undefined);

  if (!email) return data;

  const contact = await ensureCRMContact({
    email,
    marketingOptIn:
      typeof data?.contact?.marketingOptIn === "boolean"
        ? data.contact.marketingOptIn
        : typeof originalDoc?.contact?.marketingOptIn === "boolean"
          ? originalDoc.contact.marketingOptIn
          : undefined,
    name:
      getName(data?.contact?.firstName, data?.contact?.lastName) ||
      getName(originalDoc?.contact?.firstName, originalDoc?.contact?.lastName),
    payload: req.payload,
    phone:
      (typeof data?.contact?.phone === "string" ? data.contact.phone : undefined) ||
      (typeof originalDoc?.contact?.phone === "string" ? originalDoc.contact.phone : undefined),
    req,
    userID:
      getUserID(data?.customer) ||
      getUserID(originalDoc?.customer) ||
      (req.user?.email && normalizeEmail(req.user.email) === normalizeEmail(email)
        ? req.user.id
        : undefined),
  });

  return {
    ...data,
    crmContact: contact.id,
  };
};

export const syncOrderCRMContactAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const contactID = typeof doc.crmContact === "object" ? doc.crmContact?.id : doc.crmContact;
  const recipientEmail = doc.contact?.email || doc.customerEmail;

  if (!contactID || !recipientEmail) return doc;

  await recalculateCRMContactStats({
    contactID,
    email: recipientEmail,
    payload: req.payload,
    req,
  });

  if (operation === "create") {
    await recordCRMActivity({
      contactID,
      eventKey: `${CRM_ACTIVITY_TYPES.orderPlaced}:${doc.id}`,
      occurredAt: doc.createdAt,
      orderID: doc.id,
      payload: req.payload,
      req,
      summary: `Order #${doc.id} was placed.`,
      type: CRM_ACTIVITY_TYPES.orderPlaced,
    });
    return doc;
  }

  if (doc.status && doc.status !== previousDoc?.status) {
    await recordCRMActivity({
      contactID,
      eventKey: `${CRM_ACTIVITY_TYPES.orderStatusChanged}:${doc.id}:${doc.status}`,
      occurredAt: doc.updatedAt,
      orderID: doc.id,
      payload: req.payload,
      req,
      summary: `Order #${doc.id} status changed to ${doc.status}.`,
      type: CRM_ACTIVITY_TYPES.orderStatusChanged,
    });
  }

  return doc;
};

export const syncMarketingEventCRMContactBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  if (!data?.recipientEmail || typeof data.recipientEmail !== "string") return data;

  const contact = await ensureCRMContact({
    email: data.recipientEmail,
    lastCampaignSentAt: typeof data.sentAt === "string" ? data.sentAt : new Date().toISOString(),
    payload: req.payload,
    req,
  });

  return {
    ...data,
    crmContact: contact.id,
  };
};

export const syncMarketingEventCRMContactAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== "create") return doc;

  const contactID = typeof doc.crmContact === "object" ? doc.crmContact?.id : doc.crmContact;
  if (!contactID) return doc;

  await recordCRMActivity({
    cartID: typeof doc.cart === "object" ? doc.cart?.id : doc.cart,
    contactID,
    eventKey: `${CRM_ACTIVITY_TYPES.campaignSent}:${doc.id}`,
    marketingEventID: doc.id,
    occurredAt: doc.sentAt,
    orderID: typeof doc.order === "object" ? doc.order?.id : doc.order,
    payload: req.payload,
    req,
    summary: `Sent ${doc.campaign} campaign email.`,
    type: CRM_ACTIVITY_TYPES.campaignSent,
  });

  return doc;
};

export const syncDealCRMActivityAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const contactID =
    typeof doc.primaryContact === "object" ? doc.primaryContact?.id : doc.primaryContact;

  if (!contactID) return doc;

  if (operation === "create") {
    await recordCRMActivity({
      contactID,
      dealID: doc.id,
      eventKey: `${CRM_ACTIVITY_TYPES.dealCreated}:${doc.id}`,
      occurredAt: doc.createdAt,
      payload: req.payload,
      req,
      summary: `Deal "${doc.title}" was created.`,
      type: CRM_ACTIVITY_TYPES.dealCreated,
    });

    return doc;
  }

  if (doc.stage && doc.stage !== previousDoc?.stage) {
    await recordCRMActivity({
      contactID,
      dealID: doc.id,
      eventKey: `${CRM_ACTIVITY_TYPES.dealStageChanged}:${doc.id}:${doc.stage}`,
      occurredAt: doc.updatedAt,
      payload: req.payload,
      req,
      summary: `Deal "${doc.title}" moved to ${doc.stage}.`,
      type: CRM_ACTIVITY_TYPES.dealStageChanged,
    });
  }

  return doc;
};

export const syncTicketCRMActivityAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const contactID = typeof doc.contact === "object" ? doc.contact?.id : doc.contact;

  if (!contactID) return doc;

  if (operation === "create") {
    await recordCRMActivity({
      contactID,
      eventKey: `${CRM_ACTIVITY_TYPES.ticketCreated}:${doc.id}`,
      occurredAt: doc.createdAt,
      orderID: typeof doc.order === "object" ? doc.order?.id : doc.order,
      payload: req.payload,
      req,
      summary: `Support ticket "${doc.subject}" was opened.`,
      ticketID: doc.id,
      type: CRM_ACTIVITY_TYPES.ticketCreated,
    });

    return doc;
  }

  if (doc.status && doc.status !== previousDoc?.status) {
    await recordCRMActivity({
      contactID,
      eventKey: `${CRM_ACTIVITY_TYPES.ticketStatusChanged}:${doc.id}:${doc.status}`,
      occurredAt: doc.updatedAt,
      orderID: typeof doc.order === "object" ? doc.order?.id : doc.order,
      payload: req.payload,
      req,
      summary: `Support ticket "${doc.subject}" moved to ${doc.status}.`,
      ticketID: doc.id,
      type: CRM_ACTIVITY_TYPES.ticketStatusChanged,
    });
  }

  return doc;
};

export const syncNoteCRMActivityAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== "create") return doc;

  const contactID = await resolveCRMActivityContactID({
    contactID: typeof doc.contact === "object" ? doc.contact?.id : doc.contact,
    dealID: typeof doc.deal === "object" ? doc.deal?.id : doc.deal,
    payload: req.payload,
    req,
    ticketID: typeof doc.ticket === "object" ? doc.ticket?.id : doc.ticket,
  });

  if (!contactID) return doc;

  await recordCRMActivity({
    contactID,
    dealID: typeof doc.deal === "object" ? doc.deal?.id : doc.deal,
    eventKey: `${CRM_ACTIVITY_TYPES.noteAdded}:${doc.id}`,
    noteID: doc.id,
    occurredAt: doc.createdAt,
    orderID: typeof doc.order === "object" ? doc.order?.id : doc.order,
    payload: req.payload,
    req,
    summary: `CRM note added: ${doc.subject}.`,
    ticketID: typeof doc.ticket === "object" ? doc.ticket?.id : doc.ticket,
    type: CRM_ACTIVITY_TYPES.noteAdded,
  });

  return doc;
};

export const syncQuoteCRMActivityAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const contactID = typeof doc.contact === "object" ? doc.contact?.id : doc.contact;

  if (!contactID) return doc;

  if (operation === "create") {
    await recordCRMActivity({
      contactID,
      eventKey: `${CRM_ACTIVITY_TYPES.quoteCreated}:${doc.id}`,
      occurredAt: doc.createdAt,
      payload: req.payload,
      req,
      summary: `Quote ${doc.quoteNumber} was created.`,
      type: CRM_ACTIVITY_TYPES.quoteCreated,
    });

    return doc;
  }

  if (doc.status && doc.status !== previousDoc?.status) {
    await recordCRMActivity({
      contactID,
      eventKey: `${CRM_ACTIVITY_TYPES.quoteStatusChanged}:${doc.id}:${doc.status}`,
      occurredAt: doc.updatedAt,
      payload: req.payload,
      req,
      summary: `Quote ${doc.quoteNumber} moved to ${doc.status}.`,
      type: CRM_ACTIVITY_TYPES.quoteStatusChanged,
    });
  }

  return doc;
};

export const syncInvoiceCRMActivityAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const contactID = typeof doc.contact === "object" ? doc.contact?.id : doc.contact;

  if (!contactID) return doc;

  if (operation === "create") {
    await recordCRMActivity({
      contactID,
      eventKey: `${CRM_ACTIVITY_TYPES.invoiceCreated}:${doc.id}`,
      occurredAt: doc.createdAt,
      orderID: typeof doc.order === "object" ? doc.order?.id : doc.order,
      payload: req.payload,
      req,
      summary: `Invoice ${doc.invoiceNumber} was created.`,
      type: CRM_ACTIVITY_TYPES.invoiceCreated,
    });

    return doc;
  }

  if (doc.status && doc.status !== previousDoc?.status) {
    await recordCRMActivity({
      contactID,
      eventKey: `${CRM_ACTIVITY_TYPES.invoiceStatusChanged}:${doc.id}:${doc.status}`,
      occurredAt: doc.updatedAt,
      orderID: typeof doc.order === "object" ? doc.order?.id : doc.order,
      payload: req.payload,
      req,
      summary: `Invoice ${doc.invoiceNumber} moved to ${doc.status}.`,
      type: CRM_ACTIVITY_TYPES.invoiceStatusChanged,
    });
  }

  const nextBalanceDue = typeof doc.balanceDue === "number" ? doc.balanceDue : undefined;
  const previousBalanceDue =
    typeof previousDoc?.balanceDue === "number" ? previousDoc.balanceDue : undefined;

  if (
    typeof nextBalanceDue === "number" &&
    typeof previousBalanceDue === "number" &&
    nextBalanceDue < previousBalanceDue
  ) {
    const amountSettled = previousBalanceDue - nextBalanceDue;
    const paymentType =
      doc.status === "paid"
        ? CRM_ACTIVITY_TYPES.invoicePaid
        : doc.status === "partially_paid"
          ? CRM_ACTIVITY_TYPES.invoicePartiallyPaid
          : CRM_ACTIVITY_TYPES.invoicePaymentRecorded;

    const summary =
      doc.status === "paid"
        ? `Invoice ${doc.invoiceNumber} was fully paid.`
        : doc.status === "partially_paid"
          ? `Invoice ${doc.invoiceNumber} received a partial payment of ${amountSettled}.`
          : `Invoice ${doc.invoiceNumber} received a payment of ${amountSettled}.`;

    await recordCRMActivity({
      contactID,
      eventKey: `${paymentType}:${doc.id}:${nextBalanceDue}`,
      occurredAt: doc.updatedAt,
      orderID: typeof doc.order === "object" ? doc.order?.id : doc.order,
      payload: req.payload,
      req,
      summary,
      type: paymentType,
    });
  }

  return doc;
};
