import type { Payload, PayloadRequest } from "payload";

import type { User } from "@/payload-types";
import {
  buildInvoiceDueReminderEmail,
  buildInvoiceOverdueReminderEmail,
  buildQuoteExpiryReminderEmail,
} from "@/utilities/email/templates";

import {
  CAMPAIGN_SLUGS,
  CRM_INVOICES_COLLECTION,
  CRM_QUOTES_COLLECTION,
  MARKETING_EVENT_COLLECTION,
  type CampaignSlug,
} from "./constants";

type ReminderCampaignOptions = {
  invoiceDueReminderDays?: number;
  now?: Date;
  quoteExpiryReminderDays?: number;
  req?: PayloadRequest;
};

type RunReminderCampaignsResult = {
  invoiceDueRemindersSent: number;
  invoiceOverdueRemindersSent: number;
  quoteExpiryRemindersSent: number;
  skipped: number;
};

type ReservedCampaignEvent = {
  id: number;
};

type CRMContactReference = {
  email?: string | null;
  id?: number;
};

type QuoteRecord = {
  company?: number | null;
  contact?: CRMContactReference | number | null;
  expiresAt?: string | null;
  id: number;
  owner?: User["id"] | null;
  quoteNumber: string;
  status?: string | null;
};

type InvoiceRecord = {
  company?: number | null;
  contact?: CRMContactReference | number | null;
  dueDate?: string | null;
  id: number;
  invoiceNumber: string;
  owner?: User["id"] | null;
  status?: string | null;
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

const reserveCampaignEvent = async ({
  campaign,
  dedupeKey,
  payload,
  recipientEmail,
  req,
  userID,
}: {
  campaign: CampaignSlug;
  dedupeKey: string;
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
        dedupeKey,
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

const fetchAllRecords = async <T>({
  collection,
  payload,
  req,
}: {
  collection: string;
  payload: Payload;
  req?: PayloadRequest;
}) => {
  const docs: T[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection: collection as any,
      depth: 1,
      limit: 100,
      page,
      sort: "-updatedAt",
      ...getAccessArgs(req),
    });

    docs.push(...(result.docs as T[]));
    hasNextPage = Boolean(result.hasNextPage);
    page += 1;
  }

  return docs;
};

const getRecipientEmail = (contact: QuoteRecord["contact"] | InvoiceRecord["contact"]) =>
  typeof contact === "object" ? contact?.email : undefined;

const getWholeDaysBetween = (target: Date, now: Date) =>
  Math.floor((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

export const runReminderCampaigns = async ({
  invoiceDueReminderDays = 3,
  now = new Date(),
  payload,
  quoteExpiryReminderDays = 3,
  req,
}: ReminderCampaignOptions & { payload: Payload }): Promise<RunReminderCampaignsResult> => {
  const summary: RunReminderCampaignsResult = {
    invoiceDueRemindersSent: 0,
    invoiceOverdueRemindersSent: 0,
    quoteExpiryRemindersSent: 0,
    skipped: 0,
  };

  const quotes = await fetchAllRecords<QuoteRecord>({
    collection: CRM_QUOTES_COLLECTION,
    payload,
    req,
  });

  for (const quote of quotes) {
    if (!quote.expiresAt || !["draft", "sent"].includes(quote.status || "")) {
      summary.skipped += 1;
      continue;
    }

    const recipientEmail = getRecipientEmail(quote.contact);
    if (!recipientEmail) {
      summary.skipped += 1;
      continue;
    }

    const expiresAt = new Date(quote.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      summary.skipped += 1;
      continue;
    }

    const daysUntilExpiry = getWholeDaysBetween(expiresAt, now);
    if (daysUntilExpiry < 0 || daysUntilExpiry > quoteExpiryReminderDays) {
      summary.skipped += 1;
      continue;
    }

    const dedupeKey = `${CAMPAIGN_SLUGS.quoteExpiryReminder}:quote:${quote.id}:days:${daysUntilExpiry}`;
    const reservedEvent = await reserveCampaignEvent({
      campaign: CAMPAIGN_SLUGS.quoteExpiryReminder,
      dedupeKey,
      payload,
      recipientEmail: normalizeEmail(recipientEmail),
      req,
      userID: quote.owner || undefined,
    });

    if (!reservedEvent) {
      summary.skipped += 1;
      continue;
    }

    const emailMessage = buildQuoteExpiryReminderEmail({
      daysUntilExpiry,
      quoteNumber: quote.quoteNumber,
      recipientEmail,
    });

    try {
      await payload.sendEmail({
        to: recipientEmail,
        subject: emailMessage.subject,
        html: emailMessage.html,
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

    summary.quoteExpiryRemindersSent += 1;
  }

  const invoices = await fetchAllRecords<InvoiceRecord>({
    collection: CRM_INVOICES_COLLECTION,
    payload,
    req,
  });

  for (const invoice of invoices) {
    if (
      !invoice.dueDate ||
      !["issued", "partially_paid", "overdue"].includes(invoice.status || "")
    ) {
      summary.skipped += 1;
      continue;
    }

    const recipientEmail = getRecipientEmail(invoice.contact);
    if (!recipientEmail) {
      summary.skipped += 1;
      continue;
    }

    const dueDate = new Date(invoice.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      summary.skipped += 1;
      continue;
    }

    const daysUntilDue = getWholeDaysBetween(dueDate, now);

    if (daysUntilDue >= 0 && daysUntilDue <= invoiceDueReminderDays) {
      const dedupeKey = `${CAMPAIGN_SLUGS.invoiceDueReminder}:invoice:${invoice.id}:days:${daysUntilDue}`;
      const reservedEvent = await reserveCampaignEvent({
        campaign: CAMPAIGN_SLUGS.invoiceDueReminder,
        dedupeKey,
        payload,
        recipientEmail: normalizeEmail(recipientEmail),
        req,
        userID: invoice.owner || undefined,
      });

      if (!reservedEvent) {
        summary.skipped += 1;
        continue;
      }

      const emailMessage = buildInvoiceDueReminderEmail({
        daysUntilDue,
        invoiceNumber: invoice.invoiceNumber,
        recipientEmail,
      });

      try {
        await payload.sendEmail({
          to: recipientEmail,
          subject: emailMessage.subject,
          html: emailMessage.html,
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

      summary.invoiceDueRemindersSent += 1;
      continue;
    }

    if (daysUntilDue < 0) {
      const daysOverdue = Math.abs(daysUntilDue);
      const dedupeKey = `${CAMPAIGN_SLUGS.invoiceOverdueReminder}:invoice:${invoice.id}:days:${daysOverdue}`;
      const reservedEvent = await reserveCampaignEvent({
        campaign: CAMPAIGN_SLUGS.invoiceOverdueReminder,
        dedupeKey,
        payload,
        recipientEmail: normalizeEmail(recipientEmail),
        req,
        userID: invoice.owner || undefined,
      });

      if (!reservedEvent) {
        summary.skipped += 1;
        continue;
      }

      const emailMessage = buildInvoiceOverdueReminderEmail({
        daysOverdue,
        invoiceNumber: invoice.invoiceNumber,
        recipientEmail,
      });

      try {
        await payload.sendEmail({
          to: recipientEmail,
          subject: emailMessage.subject,
          html: emailMessage.html,
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

      summary.invoiceOverdueRemindersSent += 1;
      continue;
    }

    summary.skipped += 1;
  }

  return summary;
};
