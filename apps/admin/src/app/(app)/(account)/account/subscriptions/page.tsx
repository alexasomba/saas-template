import { Button } from "@/components/ui/button";
import configPromise from "@payload-config";
import { formatDateTime } from "@/utilities/formatDateTime";
import { getPayload } from "payload";
import type { Subscription } from "@/payload-types";
import { headers as getHeaders } from "next/headers.js";
import React from "react";

export default async function SubscriptionsPage() {
  const headers = await getHeaders();
  const payload = await getPayload({ config: configPromise });
  const { user } = await payload.auth({ headers });

  if (!user) {
    return null;
  }

  const subscriptions = await payload.find({
    collection: "subscriptions",
    user,
    overrideAccess: false,
    where: {
      customer: { equals: user.id },
    },
    sort: "-createdAt",
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">My Subscriptions</h1>
      {subscriptions.docs.length === 0 ? (
        <p>You have no active subscriptions.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {(subscriptions.docs as Subscription[]).map((sub) => (
            <li
              key={sub.id}
              className="border border-border rounded-lg p-6 bg-card flex flex-col md:flex-row justify-between md:items-center gap-4"
            >
              <div>
                <p className="font-semibold text-lg">
                  {typeof sub.product === "object" ? sub.product.title : "Subscription"}
                </p>
                <p className="opacity-75">
                  {sub.currency === "USD" ? "$" : "₦"}
                  {sub.currency === "USD"
                    ? (sub.subscriptionPrice / 100).toFixed(2)
                    : (sub.subscriptionPriceNGN / 100).toFixed(2)}{" "}
                  / {sub.interval > 1 ? `${sub.interval} ` : ""}
                  {sub.period}
                </p>
                <p className="opacity-75 text-sm mt-1">
                  Status:{" "}
                  <span className="font-medium capitalize">{sub.status.replace("-", " ")}</span>
                </p>
                {sub.status === "active" && sub.nextPaymentDate && (
                  <p className="opacity-75 text-sm">
                    Next payment: {formatDateTime({ date: sub.nextPaymentDate })}
                  </p>
                )}
              </div>

              {sub.status === "active" && (
                <form {...({ action: `/api/subscriptions/${sub.id}/cancel` } as any)} method="POST">
                  <Button type="submit" variant="destructive" size="sm">
                    Cancel Subscription
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
