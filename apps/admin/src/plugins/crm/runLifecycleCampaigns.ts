import type { Payload, PayloadRequest } from "payload";
import type { Cart, Order, User } from "@/payload-types";

import {
  CAMPAIGN_SLUGS,
  type CampaignSlug,
  DEFAULT_ABANDONED_CART_DELAY_HOURS,
  DEFAULT_WIN_BACK_DELAY_DAYS,
  MARKETING_EVENT_COLLECTION,
} from "./constants";
import { buildAbandonedCartEmail, buildWinBackEmail } from "@/utilities/email/templates";

type LifecycleCampaignOptions = {
  abandonedCartDelayHours?: number;
  now?: Date;
  req?: PayloadRequest;
  winBackDelayDays?: number;
};

type CustomerRecord = {
  id?: User["id"];
  email?: string | null;
  marketingOptIn?: boolean | null;
};

type CartRecord = {
  id: Cart["id"];
  customer?: User["id"] | CustomerRecord | null;
  customerEmail?: string | null;
  items?: unknown[] | null;
  marketingOptIn?: boolean | null;
  updatedAt: string;
};

type OrderRecord = {
  id: Order["id"];
  createdAt: string;
  customer?: User["id"] | CustomerRecord | null;
  customerEmail?: string | null;
  status?: string | null;
  contact?: {
    email?: string | null;
    marketingOptIn?: boolean | null;
  } | null;
};

type RunLifecycleCampaignsResult = {
  abandonedCartEmailsSent: number;
  skipped: number;
  winBackEmailsSent: number;
};

type ReservedCampaignEvent = {
  id: number;
};

const getAccessArgs = (req?: PayloadRequest) =>
  req?.user
    ? {
        overrideAccess: false as const,
        req,
      }
    : req
      ? { req }
      : {};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "";
};

const isDuplicateKeyError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("duplicate") || message.includes("unique") || message.includes("constraint")
  );
};

const getRecipientEmail = (record: {
  contact?: { email?: string | null } | null;
  customer?: number | string | CustomerRecord | null;
  customerEmail?: string | null;
}) => {
  const candidates = [
    record.contact?.email,
    record.customerEmail,
    typeof record.customer === "object" ? record.customer?.email : undefined,
  ];

  return candidates.find((value): value is string => typeof value === "string" && value.length > 0);
};

const isMarketingOptedIn = (record: {
  contact?: { marketingOptIn?: boolean | null } | null;
  customer?: number | string | CustomerRecord | null;
  marketingOptIn?: boolean | null;
}) => {
  if (typeof record.contact?.marketingOptIn === "boolean") {
    return record.contact.marketingOptIn;
  }

  if (typeof record.marketingOptIn === "boolean") {
    return record.marketingOptIn;
  }

  if (typeof record.customer === "object" && typeof record.customer?.marketingOptIn === "boolean") {
    return record.customer.marketingOptIn;
  }

  return false;
};

const hasItems = (items: unknown[] | null | undefined) => Array.isArray(items) && items.length > 0;

const reserveCampaignEvent = async ({
  campaign,
  cartID,
  dedupeKey,
  orderID,
  payload,
  recipientEmail,
  req,
  userID,
}: {
  campaign: CampaignSlug;
  cartID?: Cart["id"];
  dedupeKey: string;
  orderID?: Order["id"];
  payload: Payload;
  recipientEmail: string;
  req?: PayloadRequest;
  userID?: User["id"];
}) => {
  try {
    return (await payload.create({
      collection: MARKETING_EVENT_COLLECTION,
      data: {
        campaign,
        cart: cartID,
        dedupeKey,
        order: orderID,
        recipientEmail,
        sentAt: new Date().toISOString(),
        user: userID,
      },
      ...getAccessArgs(req),
    })) as ReservedCampaignEvent;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return null;
    }

    throw error;
  }
};

const releaseCampaignEventReservation = async ({
  eventID,
  payload,
  req,
}: {
  eventID: number;
  payload: Payload;
  req?: PayloadRequest;
}) => {
  await payload.delete({
    collection: MARKETING_EVENT_COLLECTION,
    id: eventID,
    ...getAccessArgs(req),
  });
};

const sendCampaignEmail = async ({
  html,
  payload,
  recipientEmail,
  subject,
  text,
}: {
  html: string;
  payload: Payload;
  recipientEmail: string;
  subject: string;
  text: string;
}) =>
  payload.sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });

const fetchAllCarts = async ({ payload, req }: { payload: Payload; req?: PayloadRequest }) => {
  const docs: CartRecord[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection: "carts",
      depth: 1,
      limit: 100,
      page,
      sort: "updatedAt",
      ...getAccessArgs(req),
    });

    docs.push(...(result.docs as CartRecord[]));
    hasNextPage = Boolean(result.hasNextPage);
    page += 1;
  }

  return docs;
};

const fetchAllOrders = async ({ payload, req }: { payload: Payload; req?: PayloadRequest }) => {
  const docs: OrderRecord[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection: "orders",
      depth: 1,
      limit: 100,
      page,
      sort: "-createdAt",
      ...getAccessArgs(req),
    });

    docs.push(...(result.docs as OrderRecord[]));
    hasNextPage = Boolean(result.hasNextPage);
    page += 1;
  }

  return docs;
};

export const runLifecycleCampaigns = async ({
  abandonedCartDelayHours = DEFAULT_ABANDONED_CART_DELAY_HOURS,
  now = new Date(),
  payload,
  req,
  winBackDelayDays = DEFAULT_WIN_BACK_DELAY_DAYS,
}: LifecycleCampaignOptions & { payload: Payload }): Promise<RunLifecycleCampaignsResult> => {
  const summary: RunLifecycleCampaignsResult = {
    abandonedCartEmailsSent: 0,
    skipped: 0,
    winBackEmailsSent: 0,
  };

  const abandonedBefore = new Date(now.getTime() - abandonedCartDelayHours * 60 * 60 * 1000);
  const allCarts = await fetchAllCarts({ payload, req });

  for (const cart of allCarts) {
    if (!hasItems(cart.items) || !cart.updatedAt) {
      summary.skipped += 1;
      continue;
    }

    const updatedAt = new Date(cart.updatedAt);
    if (Number.isNaN(updatedAt.getTime()) || updatedAt > abandonedBefore) {
      summary.skipped += 1;
      continue;
    }

    const recipientEmail = getRecipientEmail(cart);
    if (!recipientEmail || !isMarketingOptedIn(cart)) {
      summary.skipped += 1;
      continue;
    }

    const dedupeKey = `${CAMPAIGN_SLUGS.abandonedCart}:cart:${cart.id}`;
    const reservedEvent = await reserveCampaignEvent({
      campaign: CAMPAIGN_SLUGS.abandonedCart,
      cartID: cart.id,
      dedupeKey,
      payload,
      recipientEmail: normalizeEmail(recipientEmail),
      req,
      userID: typeof cart.customer === "object" ? cart.customer?.id : cart.customer || undefined,
    });

    if (!reservedEvent) {
      summary.skipped += 1;
      continue;
    }

    const emailMessage = buildAbandonedCartEmail({ email: recipientEmail });

    try {
      await sendCampaignEmail({
        html: emailMessage.html,
        payload,
        recipientEmail,
        subject: emailMessage.subject,
        text: emailMessage.text,
      });
    } catch (error) {
      await releaseCampaignEventReservation({
        eventID: reservedEvent.id,
        payload,
        req,
      });

      throw error;
    }

    summary.abandonedCartEmailsSent += 1;
  }

  const winBackBefore = new Date(now.getTime() - winBackDelayDays * 24 * 60 * 60 * 1000);
  const allOrders = await fetchAllOrders({ payload, req });
  const latestOrderByEmail = new Map<string, OrderRecord>();

  for (const order of allOrders) {
    if (order.status === "cancelled") continue;

    const recipientEmail = getRecipientEmail(order);
    if (!recipientEmail || latestOrderByEmail.has(normalizeEmail(recipientEmail))) continue;

    latestOrderByEmail.set(normalizeEmail(recipientEmail), order);
  }

  for (const order of latestOrderByEmail.values()) {
    const recipientEmail = getRecipientEmail(order);
    if (!recipientEmail || !isMarketingOptedIn(order)) {
      summary.skipped += 1;
      continue;
    }

    const createdAt = new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt > winBackBefore) {
      summary.skipped += 1;
      continue;
    }

    const dedupeKey = `${CAMPAIGN_SLUGS.winBack}:order:${order.id}:email:${normalizeEmail(
      recipientEmail,
    )}`;
    const reservedEvent = await reserveCampaignEvent({
      campaign: CAMPAIGN_SLUGS.winBack,
      dedupeKey,
      orderID: order.id,
      payload,
      recipientEmail: normalizeEmail(recipientEmail),
      req,
      userID: typeof order.customer === "object" ? order.customer?.id : order.customer || undefined,
    });

    if (!reservedEvent) {
      summary.skipped += 1;
      continue;
    }

    const emailMessage = buildWinBackEmail({ email: recipientEmail });

    try {
      await sendCampaignEmail({
        html: emailMessage.html,
        payload,
        recipientEmail,
        subject: emailMessage.subject,
        text: emailMessage.text,
      });
    } catch (error) {
      await releaseCampaignEventReservation({
        eventID: reservedEvent.id,
        payload,
        req,
      });

      throw error;
    }

    summary.winBackEmailsSent += 1;
  }

  return summary;
};
