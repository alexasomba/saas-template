import type { CollectionAfterChangeHook } from "payload";
import type { Order, Product } from "@/payload-types";

export const createSubscriptionOnPayment: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const { payload } = req;

  // Ensure this runs only when order becomes 'paid'
  // Note: Payload ecommerce plugin sets status to 'completed' or something else, but let's check doc.status
  // Assuming 'completed' means paid in this context unless 'paid' is a custom status
  const isPaidNow = doc.status === "completed" || doc.status === "paid";
  const wasNotPaidBefore = previousDoc?.status !== "completed" && previousDoc?.status !== "paid";

  if (!(isPaidNow && wasNotPaidBefore)) {
    return doc;
  }

  const order = doc as Order;

  // Check if any line items are subscription products
  if (!order.items || !Array.isArray(order.items)) return doc;

  for (const item of order.items) {
    if (!item.product) continue;

    const productSlugOrId = typeof item.product === "object" ? item.product.id : item.product;

    const fullProduct = (await payload.findByID({
      collection: "products",
      id: productSlugOrId as number,
      depth: 0,
      req,
    })) as Product;

    if (fullProduct?.isSubscription) {
      const trialDays = fullProduct.trialDays || 0;
      const now = new Date();

      const nextPaymentDate = new Date(now);
      if (trialDays > 0) {
        nextPaymentDate.setDate(nextPaymentDate.getDate() + trialDays);
      } else {
        const interval = fullProduct.interval || 1;
        switch (fullProduct.period) {
          case "day":
            nextPaymentDate.setDate(nextPaymentDate.getDate() + interval);
            break;
          case "week":
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 7 * interval);
            break;
          case "month":
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + interval);
            break;
          case "year":
            nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + interval);
            break;
          default:
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + interval);
        }
      }

      let endDate: string | undefined = undefined;
      if (fullProduct.expiryLength && fullProduct.expiryLength > 0) {
        const end = new Date(nextPaymentDate);
        const expiryLength = fullProduct.expiryLength;
        const interval = fullProduct.interval || 1;
        switch (fullProduct.period) {
          case "day":
            end.setDate(end.getDate() + interval * expiryLength);
            break;
          case "week":
            end.setDate(end.getDate() + 7 * interval * expiryLength);
            break;
          case "month":
            end.setMonth(end.getMonth() + interval * expiryLength);
            break;
          case "year":
            end.setFullYear(end.getFullYear() + interval * expiryLength);
            break;
        }
        endDate = end.toISOString();
      }

      // Check for Stripe/Paystack transaction data if available
      let authCode = "";
      let customerCode = "";
      let pEmail = "";
      const tx = (order as unknown as Record<string, unknown>).paystackTransaction as Record<
        string,
        unknown
      >;
      if (tx && typeof tx === "object") {
        const auth = tx.authorization as Record<string, unknown> | undefined;
        const cst = tx.customer as Record<string, unknown> | undefined;
        authCode = (auth?.authorization_code as string) || "";
        customerCode = (cst?.customer_code as string) || "";
        pEmail = (cst?.email as string) || "";
      }

      const customerId = typeof order.customer === "object" ? order.customer?.id : order.customer;

      if (!customerId) {
        payload.logger.warn(
          `Could not create subscription for order ${order.id}: missing customer`,
        );
        continue;
      }

      await payload.create({
        collection: "subscriptions",
        data: {
          status: "active",
          customer: customerId as number,
          product: fullProduct.id,
          variant: typeof item.variant === "object" ? item.variant?.id : item.variant,
          order: order.id,
          period: fullProduct.period || "month",
          interval: fullProduct.interval || 1,
          nextPaymentDate: nextPaymentDate.toISOString(),
          endDate: endDate,
          trialEndDate: trialDays > 0 ? nextPaymentDate.toISOString() : undefined,
          subscriptionPrice: fullProduct.subscriptionPrice || 0,
          subscriptionPriceNGN: fullProduct.subscriptionPriceNGN || 0,
          currency: order.currency || "NGN",
          paystackAuthCode: authCode,
          paystackCustomerCode: customerCode,
          paystackEmail: pEmail,
        },
        req,
      });
    }
  }

  return doc;
};
