import type { CollectionAfterChangeHook } from "payload";

import { CAMPAIGN_SLUGS } from "./constants";
import { buildCelebrateFirstPurchaseEmail } from "@/utilities/email/templates";
import { MARKETING_EVENT_COLLECTION } from "./constants";

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

export const sendFirstPurchaseCelebrationEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== "create") return doc;

  const recipientEmail =
    doc.contact?.email ||
    doc.customerEmail ||
    (typeof doc.customer === "object" ? doc.customer?.email : undefined);

  if (!recipientEmail) return doc;
  if (doc.contact?.marketingOptIn !== true) return doc;
  if (!doc.accessToken) return doc;

  const dedupeKey = `${CAMPAIGN_SLUGS.firstTimeBuyer}:order:${doc.id}`;

  const ordersForEmail = await req.payload.find({
    collection: "orders",
    limit: 2,
    req,
    where: {
      customerEmail: {
        equals: recipientEmail,
      },
    },
  });

  if (ordersForEmail.totalDocs > 1) return doc;

  const emailMessage = buildCelebrateFirstPurchaseEmail({
    accessToken: doc.accessToken,
    orderID: doc.id,
  });

  let reservedEventID: number | undefined;

  try {
    const reservedEvent = await req.payload.create({
      collection: MARKETING_EVENT_COLLECTION,
      data: {
        campaign: CAMPAIGN_SLUGS.firstTimeBuyer,
        dedupeKey,
        order: doc.id,
        recipientEmail: normalizeEmail(recipientEmail),
        sentAt: new Date().toISOString(),
        user:
          typeof doc.customer === "object" ? doc.customer?.id : (doc.customer as number | string),
      },
      req,
    });
    reservedEventID = typeof reservedEvent.id === "number" ? reservedEvent.id : undefined;

    await req.payload.sendEmail({
      to: recipientEmail,
      subject: emailMessage.subject,
      html: emailMessage.html,
      text: emailMessage.text,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return doc;
    }

    if (typeof reservedEventID === "number" && typeof req.payload.delete === "function") {
      await req.payload.delete({
        collection: MARKETING_EVENT_COLLECTION,
        id: reservedEventID,
        req,
      });
    }

    req.payload.logger.warn(error, "Failed to send first-time buyer celebration email.");
  }

  return doc;
};
