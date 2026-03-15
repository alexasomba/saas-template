import type { CollectionAfterChangeHook } from "payload";

import { buildOrderStatusEmail } from "@/utilities/email/templates";

export const sendOrderStatusEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== "update") return doc;
  if (!doc?.status || doc.status === previousDoc?.status) return doc;

  const customerEmail =
    doc.contact?.email ||
    doc.customerEmail ||
    (typeof previousDoc?.contact?.email === "string" ? previousDoc.contact.email : undefined) ||
    previousDoc?.customerEmail;

  if (!customerEmail) return doc;
  if (!doc.accessToken) return doc;

  try {
    const emailMessage = buildOrderStatusEmail({
      accessToken: doc.accessToken,
      orderID: doc.id,
      status: doc.status,
    });

    await req.payload.sendEmail({
      to: customerEmail,
      subject: emailMessage.subject,
      html: emailMessage.html,
      text: emailMessage.text,
    });
  } catch (error) {
    req.payload.logger.warn(error, "Failed to send order status email.");
  }

  return doc;
};
