import type { Payload, PayloadRequest, Where } from "payload";

import type { Cart, Order, User } from "@/payload-types";

import {
  CRM_ACTIVITIES_COLLECTION,
  CRM_ACTIVITY_TYPES,
  CRM_CONTACTS_COLLECTION,
  CRM_DEALS_COLLECTION,
  CRM_SEGMENTS_COLLECTION,
  CRM_TICKETS_COLLECTION,
  type CRMActivityType,
} from "./constants";

type CRMContactLike = {
  email?: string | null;
  id: number;
  lastCartAt?: string | null;
  lastCampaignSentAt?: string | null;
  lifecycleStage?: string | null;
  marketingOptIn?: boolean | null;
  name?: string | null;
  phone?: string | null;
  tags?:
    | {
        tag?: string | null;
        id?: string | null;
      }[]
    | null;
  totalOrders?: number | null;
  totalSpend?: number | null;
  user?: number | User | null;
};

type CRMOrderLike = Pick<Order, "amount" | "contact" | "createdAt" | "customerEmail" | "status">;

type AccessArgs = {
  overrideAccess: true;
  req?: PayloadRequest;
};

type EnsureCRMContactArgs = {
  email: string;
  lastCampaignSentAt?: string;
  lastCartAt?: string;
  marketingOptIn?: boolean;
  name?: string;
  payload: Payload;
  phone?: string;
  req?: PayloadRequest;
  userID?: number;
};

type RecordCRMActivityArgs = {
  cartID?: Cart["id"];
  contactID: number;
  dealID?: number;
  eventKey: string;
  marketingEventID?: number;
  noteID?: number;
  occurredAt?: string;
  orderID?: Order["id"];
  payload: Payload;
  req?: PayloadRequest;
  summary: string;
  ticketID?: number;
  type: CRMActivityType;
};

type RecalculateCRMStatsArgs = {
  contactID: number;
  email: string;
  payload: Payload;
  req?: PayloadRequest;
};

type CRMSegmentLike = {
  lastOrderBeforeDays?: number | null;
  lifecycleStages?: { value?: string | null }[] | null;
  marketingOptInOnly?: boolean | null;
  minimumTotalOrders?: number | null;
  minimumTotalSpend?: number | null;
  tags?: { tag?: string | null }[] | null;
};

const CRM_VIP_ORDER_COUNT = 5;
const CRM_VIP_TOTAL_SPEND = 250000;
const CRM_LAPSED_AFTER_DAYS = 30;

const internalAccessArgs = (req?: PayloadRequest): AccessArgs => ({
  overrideAccess: true,
  ...(req ? { req } : {}),
});

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const deriveLifecycleStage = ({
  lastCartAt,
  lastOrderAt,
  totalOrders,
  totalSpend,
}: {
  lastCartAt?: string | null;
  lastOrderAt?: string | null;
  totalOrders: number;
  totalSpend: number;
}) => {
  if (lastOrderAt) {
    const lastOrderDate = new Date(lastOrderAt);
    const lapsedThreshold = new Date(Date.now() - CRM_LAPSED_AFTER_DAYS * 24 * 60 * 60 * 1000);

    if (!Number.isNaN(lastOrderDate.getTime()) && lastOrderDate < lapsedThreshold) {
      return "lapsed";
    }
  }

  if (totalOrders >= CRM_VIP_ORDER_COUNT || totalSpend >= CRM_VIP_TOTAL_SPEND) {
    return "vip";
  }

  if (totalOrders >= 2) {
    return "repeat";
  }

  if (totalOrders === 1) {
    return "customer";
  }

  if (lastCartAt) {
    return "lead";
  }

  return "subscriber";
};

export const findCRMContactByEmail = async ({
  email,
  payload,
  req,
}: {
  email: string;
  payload: Payload;
  req?: PayloadRequest;
}) => {
  const result = await payload.find({
    collection: CRM_CONTACTS_COLLECTION,
    limit: 1,
    where: {
      email: {
        equals: normalizeEmail(email),
      },
    },
    ...internalAccessArgs(req),
  });

  return (result.docs[0] as CRMContactLike | undefined) || null;
};

export const ensureCRMContact = async ({
  email,
  lastCampaignSentAt,
  lastCartAt,
  marketingOptIn,
  name,
  payload,
  phone,
  req,
  userID,
}: EnsureCRMContactArgs) => {
  const normalizedEmail = normalizeEmail(email);
  const existing = await findCRMContactByEmail({
    email: normalizedEmail,
    payload,
    req,
  });

  const baseData = {
    email: normalizedEmail,
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(typeof marketingOptIn === "boolean" ? { marketingOptIn } : {}),
    ...(lastCartAt ? { lastCartAt } : {}),
    ...(lastCampaignSentAt ? { lastCampaignSentAt } : {}),
    ...(userID ? { user: userID } : {}),
  };

  if (existing) {
    return (await payload.update({
      collection: CRM_CONTACTS_COLLECTION,
      id: existing.id,
      data: {
        ...baseData,
        name: name || existing.name || undefined,
        phone: phone || existing.phone || undefined,
        marketingOptIn:
          typeof marketingOptIn === "boolean" ? marketingOptIn : existing.marketingOptIn || false,
        user: userID || (typeof existing.user === "object" ? existing.user?.id : existing.user),
        lastCampaignSentAt: lastCampaignSentAt || existing.lastCampaignSentAt || undefined,
        lastCartAt: lastCartAt || existing.lastCartAt || undefined,
      },
      ...internalAccessArgs(req),
    })) as CRMContactLike;
  }

  return (await payload.create({
    collection: CRM_CONTACTS_COLLECTION,
    data: {
      ...baseData,
      lifecycleStage: lastCartAt ? "lead" : "subscriber",
      marketingOptIn: marketingOptIn || false,
      totalOrders: 0,
      totalSpend: 0,
    },
    ...internalAccessArgs(req),
  })) as CRMContactLike;
};

export const recalculateCRMContactStats = async ({
  contactID,
  email,
  payload,
  req,
}: RecalculateCRMStatsArgs) => {
  const normalizedEmail = normalizeEmail(email);
  const orders: CRMOrderLike[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const orderResult = await payload.find({
      collection: "orders",
      limit: 100,
      page,
      sort: "createdAt",
      where: {
        customerEmail: {
          equals: normalizedEmail,
        },
      },
      ...internalAccessArgs(req),
    });

    orders.push(...(orderResult.docs as CRMOrderLike[]));
    hasNextPage = Boolean(orderResult.hasNextPage);
    page += 1;
  }

  const validOrders = orders.filter((order) => order.status !== "cancelled");
  const firstOrderAt = validOrders[0]?.createdAt || null;
  const lastOrderAt = validOrders[validOrders.length - 1]?.createdAt || null;
  const totalOrders = validOrders.length;
  const totalSpend = validOrders.reduce((sum, order) => {
    return sum + (typeof order.amount === "number" ? order.amount : 0);
  }, 0);

  const existing = await payload.findByID({
    collection: CRM_CONTACTS_COLLECTION,
    id: contactID,
    ...internalAccessArgs(req),
  });

  const lifecycleStage = deriveLifecycleStage({
    lastCartAt: (existing as CRMContactLike).lastCartAt || null,
    lastOrderAt,
    totalOrders,
    totalSpend,
  });

  return payload.update({
    collection: CRM_CONTACTS_COLLECTION,
    id: contactID,
    data: {
      firstOrderAt,
      lastOrderAt,
      lifecycleStage,
      totalOrders,
      totalSpend,
    },
    ...internalAccessArgs(req),
  });
};

export const buildCRMSegmentWhere = (segment: CRMSegmentLike): Where => {
  const clauses: Where[] = [];

  if (segment.marketingOptInOnly) {
    clauses.push({
      marketingOptIn: {
        equals: true,
      },
    });
  }

  if (typeof segment.minimumTotalOrders === "number") {
    clauses.push({
      totalOrders: {
        greater_than_equal: segment.minimumTotalOrders,
      },
    });
  }

  if (typeof segment.minimumTotalSpend === "number") {
    clauses.push({
      totalSpend: {
        greater_than_equal: segment.minimumTotalSpend,
      },
    });
  }

  if (typeof segment.lastOrderBeforeDays === "number" && segment.lastOrderBeforeDays > 0) {
    const before = new Date(Date.now() - segment.lastOrderBeforeDays * 24 * 60 * 60 * 1000);

    clauses.push({
      lastOrderAt: {
        less_than: before.toISOString(),
      },
    });
  }

  const lifecycleValues =
    segment.lifecycleStages
      ?.map((entry) => entry.value)
      .filter((value): value is string => Boolean(value)) || [];

  if (lifecycleValues.length > 0) {
    clauses.push({
      lifecycleStage: {
        in: lifecycleValues,
      },
    });
  }

  const tagValues =
    segment.tags
      ?.map((entry) => entry.tag?.trim())
      .filter((value): value is string => Boolean(value)) || [];

  tagValues.forEach((tag) => {
    clauses.push({
      "tags.tag": {
        equals: tag,
      },
    });
  });

  if (clauses.length === 0) {
    return {} as Where;
  }

  return clauses.length === 1 ? clauses[0] : ({ and: clauses } as Where);
};

export const countCRMSegmentContacts = async ({
  payload,
  req,
  segmentID,
}: {
  payload: Payload;
  req?: PayloadRequest;
  segmentID: number;
}) => {
  const segment = await payload.findByID({
    collection: CRM_SEGMENTS_COLLECTION,
    id: segmentID,
    ...internalAccessArgs(req),
  });

  const where = buildCRMSegmentWhere(segment as CRMSegmentLike);

  const result = await payload.find({
    collection: CRM_CONTACTS_COLLECTION,
    limit: 1,
    where,
    ...internalAccessArgs(req),
  });

  return result.totalDocs;
};

export const resolveCRMActivityContactID = async ({
  contactID,
  dealID,
  payload,
  req,
  ticketID,
}: {
  contactID?: number;
  dealID?: number;
  payload: Payload;
  req?: PayloadRequest;
  ticketID?: number;
}) => {
  if (contactID) return contactID;

  if (dealID) {
    const deal = await payload.findByID({
      collection: CRM_DEALS_COLLECTION,
      id: dealID,
      ...internalAccessArgs(req),
    });

    const resolvedContactID =
      typeof deal.primaryContact === "object" ? deal.primaryContact?.id : deal.primaryContact;

    if (typeof resolvedContactID === "number") {
      return resolvedContactID;
    }
  }

  if (ticketID) {
    const ticket = await payload.findByID({
      collection: CRM_TICKETS_COLLECTION,
      id: ticketID,
      ...internalAccessArgs(req),
    });

    const resolvedContactID =
      typeof ticket.contact === "object" ? ticket.contact?.id : ticket.contact;

    if (typeof resolvedContactID === "number") {
      return resolvedContactID;
    }
  }

  return undefined;
};

export const recordCRMActivity = async ({
  cartID,
  contactID,
  dealID,
  eventKey,
  marketingEventID,
  noteID,
  occurredAt,
  orderID,
  payload,
  req,
  summary,
  ticketID,
  type,
}: RecordCRMActivityArgs) => {
  const existing = await payload.find({
    collection: CRM_ACTIVITIES_COLLECTION,
    limit: 1,
    where: {
      eventKey: {
        equals: eventKey,
      },
    },
    ...internalAccessArgs(req),
  });

  if (existing.totalDocs > 0) {
    return existing.docs[0];
  }

  return payload.create({
    collection: CRM_ACTIVITIES_COLLECTION,
    data: {
      cart: cartID,
      contact: contactID,
      deal: dealID,
      eventKey,
      marketingEvent: marketingEventID,
      note: noteID,
      occurredAt: occurredAt || new Date().toISOString(),
      order: orderID,
      summary,
      ticket: ticketID,
      type,
    },
    ...internalAccessArgs(req),
  });
};

export const createUserSyncedActivity = async ({
  contactID,
  email,
  payload,
  req,
}: {
  contactID: number;
  email: string;
  payload: Payload;
  req?: PayloadRequest;
}) =>
  recordCRMActivity({
    contactID,
    eventKey: `${CRM_ACTIVITY_TYPES.userSynced}:${normalizeEmail(email)}`,
    payload,
    req,
    summary: `Customer profile synced for ${email}.`,
    type: CRM_ACTIVITY_TYPES.userSynced,
  });
