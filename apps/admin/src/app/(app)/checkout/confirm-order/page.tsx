import type { Order } from "@/payload-types";
import type { Metadata } from "next";

import { mergeOpenGraph } from "@/utilities/mergeOpenGraph";
import React from "react";
import { ConfirmOrder } from "@/components/checkout/ConfirmOrder";
import { headers as getHeaders } from "next/headers.js";
import configPromise from "@payload-config";
import { getPayload } from "payload";
import { canAccessOrder } from "@/utilities/orders/canAccessOrder";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type OrderSummary = {
  id: Order["id"];
  amount?: Order["amount"];
  currency?: Order["currency"];
  status?: Order["status"];
  createdAt?: Order["createdAt"];
  customerEmail?: Order["customerEmail"];
  items?: Order["items"];
  shippingAddress?: Order["shippingAddress"];
  contact?: Order["contact"];
  accountInvite?: Order["accountInvite"];
};

function getSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function ConfirmOrderPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: SearchParams;
}) {
  const searchParams = await searchParamsPromise;

  const orderId = getSingleParam(searchParams.orderId);
  const accessToken = getSingleParam(searchParams.accessToken);
  const inviteTokenFromQuery = getSingleParam(searchParams.inviteToken);

  const headers = await getHeaders();
  console.log("ConfirmOrderPage: headers fetched");
  const payload = await getPayload({ config: configPromise });
  console.log("ConfirmOrderPage: payload fetched");
  const { user } = await payload.auth({ headers });
  console.log("ConfirmOrderPage: user auth complete", { userId: user?.id });

  let orderSummary: OrderSummary | null = null;
  let inviteToken: string | undefined = inviteTokenFromQuery;

  if (orderId) {
    console.log("ConfirmOrderPage: searching for orderId:", orderId);
    try {
      const {
        docs: [order],
      } = await payload.find({
        collection: "orders",
        limit: 1,
        depth: 2,
        where: {
          id: {
            equals: Number.isNaN(Number(orderId)) ? orderId : Number(orderId),
          },
        },
        overrideAccess: true,
        user,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          customerEmail: true,
          items: true,
          shippingAddress: true,
          contact: true,
          accountInvite: true,
          accessToken: true,
          customer: true,
        },
      });

      console.log("ConfirmOrderPage: order search result:", order?.id ? "found" : "not found");

      if (
        order &&
        canAccessOrder({ order, user, accessToken, inviteToken: inviteTokenFromQuery })
      ) {
        console.log("ConfirmOrderPage: access granted to order:", order.id);
        orderSummary = {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          createdAt: order.createdAt,
          customerEmail: order.customerEmail,
          items: order.items,
          shippingAddress: order.shippingAddress,
          contact: order.contact,
          accountInvite: order.accountInvite,
        };

        if (!inviteToken && order.accountInvite?.token) {
          inviteToken = order.accountInvite.token;
        }
      } else {
        console.warn("ConfirmOrderPage: access denied to order:", orderId);
      }
    } catch (error) {
      console.error("ConfirmOrderPage: error loading order:", error);
      payload.logger.error(error, "Error loading order for confirmation page.");
    }
  } else {
    console.warn("ConfirmOrderPage: no orderId in searchParams");
  }

  console.log("ConfirmOrderPage: rendering ConfirmOrder");
  return (
    <div className="container min-h-[90vh] flex py-12">
      <ConfirmOrder
        accessToken={accessToken}
        email={orderSummary?.contact?.email ?? orderSummary?.customerEmail ?? undefined}
        inviteToken={inviteToken}
        order={orderSummary}
      />
    </div>
  );
}

export const metadata: Metadata = {
  description: "Confirm order.",
  openGraph: mergeOpenGraph({
    title: "Confirming order",
    url: "/checkout/confirm-order",
  }),
  title: "Confirming order",
};
