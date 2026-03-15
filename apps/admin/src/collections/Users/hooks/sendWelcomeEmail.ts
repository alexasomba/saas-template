import type { CollectionAfterChangeHook } from "payload";

import { buildWelcomeEmail } from "@/utilities/email/templates";

export const sendWelcomeEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== "update") return doc;
  if (!doc?._verified || previousDoc?._verified === true) return doc;
  if (!doc.email) return doc;

  try {
    const emailMessage = buildWelcomeEmail({
      email: doc.email,
      name: typeof doc.name === "string" ? doc.name : undefined,
    });

    await req.payload.sendEmail({
      to: doc.email,
      subject: emailMessage.subject,
      html: emailMessage.html,
      text: emailMessage.text,
    });
  } catch (error) {
    req.payload.logger.warn(error, "Failed to send welcome email after verification.");
  }

  return doc;
};
