import type { TaskConfig } from "payload";
import type { Subscription } from "@/payload-types";

export const chargeSubscriptions: TaskConfig = {
  slug: "chargeSubscriptions",
  inputSchema: [
    {
      name: "limit",
      type: "number",
      admin: {
        description: "Maximum number of subscriptions to process in this batch",
      },
    },
  ],
  outputSchema: [
    {
      name: "processed",
      type: "number",
    },
    {
      name: "successCount",
      type: "number",
    },
    {
      name: "errorCount",
      type: "number",
    },
  ],
  interfaceName: "ChargeSubscriptionsTask",
  concurrency: () => "charge-subscriptions-batch",
  handler: async ({ req }: { req: any }) => {
    const payload = req.payload;
    const now = new Date();

    // Find due subscriptions
    const dueSubscriptions = await payload.find({
      collection: "subscriptions",
      where: {
        status: { equals: "active" },
        nextPaymentDate: { less_than_equal: now.toISOString() },
      },
      pagination: false,
      req,
    });

    const results = {
      processed: dueSubscriptions.docs.length,
      successCount: 0,
      errorCount: 0,
    };

    for (const sub of dueSubscriptions.docs as Subscription[]) {
      // Skip if no paystack authorization is stored
      if (!sub.paystackAuthCode || !sub.paystackEmail) {
        payload.logger.error(`Subscription ${sub.id} missing Paystack auth`);
        results.errorCount++;
        continue;
      }

      try {
        // 1. Charge the authorization securely
        const response = await fetch("https://api.paystack.co/transaction/charge_authorization", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: sub.paystackEmail,
            amount: sub.subscriptionPriceNGN,
            authorization_code: sub.paystackAuthCode,
          }),
        });

        const responseData = (await response.json()) as Record<string, unknown>;

        if (response.ok && (responseData.data as any)?.status === "success") {
          const nextDate = new Date(sub.nextPaymentDate || now.toISOString());
          const interval = sub.interval || 1;
          switch (sub.period) {
            case "day":
              nextDate.setDate(nextDate.getDate() + interval);
              break;
            case "week":
              nextDate.setDate(nextDate.getDate() + 7 * interval);
              break;
            case "month":
              nextDate.setMonth(nextDate.getMonth() + interval);
              break;
            case "year":
              nextDate.setFullYear(nextDate.getFullYear() + interval);
              break;
            default:
              nextDate.setMonth(nextDate.getMonth() + interval);
          }

          // 3. Create a renewal order
          const renewalOrder = await payload.create({
            collection: "orders",
            data: {
              customer: typeof sub.customer === "object" ? sub.customer.id : sub.customer,
              status: "completed",
              amount: sub.subscriptionPrice,
              currency: sub.currency as "USD" | "NGN",
              items: [
                {
                  product: typeof sub.product === "object" ? sub.product.id : sub.product,
                  variant: typeof sub.variant === "object" ? sub.variant?.id : sub.variant,
                  quantity: 1,
                },
              ],
            },
            req,
          });

          // 4. Update the subscription
          const existingOrders = Array.isArray(sub.renewalOrders)
            ? sub.renewalOrders.map((o) => (typeof o === "object" ? o.id : o))
            : [];

          await payload.update({
            collection: "subscriptions",
            id: sub.id,
            data: {
              nextPaymentDate: nextDate.toISOString(),
              failedPaymentCount: 0,
              renewalOrders: [...existingOrders, renewalOrder.id],
            },
            req,
          });

          results.successCount++;
        } else {
          // Charge failed
          const newFailCount = (sub.failedPaymentCount || 0) + 1;
          const newStatus = newFailCount >= 2 ? "on-hold" : "active";

          await payload.update({
            collection: "subscriptions",
            id: sub.id,
            data: {
              failedPaymentCount: newFailCount,
              lastFailedAt: now.toISOString(),
              status: newStatus,
            },
            req,
          });
          results.errorCount++;
          payload.logger.error(
            `Charge failed for subscription ${sub.id}: ${(responseData as any).message}`,
          );
        }
      } catch (e: unknown) {
        results.errorCount++;
        if (e instanceof Error) {
          payload.logger.error(`Error charging subscription ${sub.id}: ${e.message}`);
        }
      }
    }

    return {
      output: results,
    };
  },
};
