import { NextRequest } from "next/server";
import { createPaystack } from "@alexasomba/paystack-node";
import { randomUUID } from "node:crypto";

import configPromise from "@payload-config";
import { getPayload } from "payload";

import type { Cart, Order } from "@/payload-types";
import { buildOrderConfirmationEmail } from "@/utilities/email/templates";
import {
  CheckoutContact,
  CheckoutShippingAddress,
  getOrderCurrency,
  isRecord,
  isShippingAddressComplete,
  normalizeCheckoutContact,
  normalizeShippingAddress,
  parseMetadataJSON,
} from "@/utilities/checkout/paystack";
import { getEffectiveUnitPrice } from "@/utilities/ecommerce/pricing";

declare global {
  var PAYSTACK_SECRET_KEY: string | undefined;
}

let paystackClient: ReturnType<typeof createPaystack> | null = null;

function getPaystackClient() {
  if (!paystackClient) {
    const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
    const secretKey =
      process.env.PAYSTACK_SECRET_KEY ??
      globalThis.PAYSTACK_SECRET_KEY ??
      (isTestEnv ? "sk_test_mock" : undefined);

    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is required to process checkout requests.");
    }

    paystackClient = createPaystack({ secretKey });
  }

  return paystackClient;
}

const ACCOUNT_INVITE_TTL_HOURS = 72;

type CheckoutRequest = {
  cartID?: string | number;
  contact?: CheckoutContact;
  shippingAddress?: CheckoutShippingAddress;
  paymentData?: {
    reference: string;
  };
  marketingOptIn?: boolean;
};

type ErrorResponse = {
  error: string;
};

function jsonError(message: string, status: number) {
  const payload: ErrorResponse = { error: message };
  return Response.json(payload, { status });
}

function buildInvite(expiryHours: number) {
  const expires = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  return {
    token: randomUUID(),
    expiresAt: expires.toISOString(),
  };
}

function extractID(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (isRecord(value) && "id" in value) {
    const idCandidate = value.id;
    if (typeof idCandidate === "string" || typeof idCandidate === "number") {
      return String(idCandidate);
    }
  }

  return null;
}

function formatVariantSummary(variant: unknown): string | null {
  if (!isRecord(variant)) return null;

  const options = Array.isArray(variant.options)
    ? (variant.options as unknown[])
        .map((option) => (isRecord(option) ? option : null))
        .filter((option): option is Record<string, unknown> => !!option)
    : [];

  if (options.length === 0) {
    return typeof variant.title === "string" ? variant.title : null;
  }

  const parts = options
    .map((option) => {
      const label = typeof option.label === "string" ? option.label : null;
      const value = typeof option.value === "string" ? option.value : null;
      if (label && value) return `${label}: ${value}`;
      return value ?? label ?? null;
    })
    .filter((part): part is string => !!part);

  return parts.length > 0 ? parts.join(" / ") : null;
}

function buildOrderItems(cart: Cart | null | undefined, currency: string = getOrderCurrency()) {
  if (!cart?.items || !Array.isArray(cart.items)) {
    return [];
  }

  return cart.items.map((item) => {
    const product = isRecord(item.product) ? item.product : null;
    const variant = isRecord(item.variant) ? item.variant : null;

    return {
      id: item.id ?? undefined,
      productId: extractID(product ?? item.product),
      variantId: item.variant ? extractID(variant ?? item.variant) : null,
      quantity: item.quantity,
      unitPrice:
        getEffectiveUnitPrice({
          currencyCode: currency,
          product,
          variant,
        }) ?? null,
      title: isRecord(product) && typeof product.title === "string" ? product.title : null,
      variantSummary: formatVariantSummary(variant),
    };
  });
}

function sanitizeOrder(order: Order, reference?: string, itemsOverride?: unknown[]) {
  if (!order) return null;
  const {
    id,
    items,
    shippingAddress,
    status,
    amount,
    currency,
    customerEmail,
    contact,
    accountInvite,
  } = order;
  const responseItems =
    Array.isArray(itemsOverride) && itemsOverride.length > 0 ? itemsOverride : items;
  return {
    id,
    status,
    amount,
    currency,
    items: responseItems,
    customerEmail,
    shippingAddress,
    contact,
    accountInvite,
    payment: reference
      ? {
          reference,
          status: "succeeded",
        }
      : undefined,
  };
}

type PaystackCheckoutMetadata = {
  cartID?: string;
  cartItemsSnapshot?: string;
  contact?: string;
  shippingAddress?: string;
};

export async function POST(request: NextRequest) {
  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch (_error) {
    return jsonError("Invalid JSON payload.", 400);
  }

  if (!body || typeof body !== "object") {
    return jsonError("Invalid checkout payload.", 400);
  }

  const { contact, shippingAddress, paymentData, marketingOptIn = false } = body;
  const reference = paymentData?.reference;

  if (!reference || typeof reference !== "string") {
    return jsonError("Payment reference is required.", 400);
  }

  const payload = await getPayload({ config: configPromise });

  const transactions = await payload.find({
    collection: "transactions",
    where: {
      "paystack.reference": {
        equals: reference,
      },
    },
    limit: 1,
    depth: 2,
  });

  const transaction = transactions.docs[0];

  if (!transaction) {
    return jsonError("Checkout session not found. Please restart payment.", 400);
  }

  if (transaction.status === "succeeded" && transaction.order) {
    const existingOrderId =
      typeof transaction.order === "object" ? transaction.order.id : transaction.order;
    const existingOrder =
      typeof transaction.order === "object"
        ? transaction.order
        : await payload.findByID({ collection: "orders", id: existingOrderId, depth: 2 });
    const existingCart = typeof transaction.cart === "object" ? (transaction.cart as Cart) : null;
    const orderCurrency =
      typeof existingOrder === "object"
        ? getOrderCurrency(existingOrder.currency)
        : getOrderCurrency();
    return Response.json({
      order: sanitizeOrder(
        existingOrder as Order,
        reference,
        buildOrderItems(existingCart, orderCurrency),
      ),
      orderAccessToken:
        typeof existingOrder === "object" ? (existingOrder.accessToken ?? null) : null,
      accountInviteToken:
        typeof existingOrder === "object" ? (existingOrder.accountInvite?.token ?? null) : null,
    });
  }

  let paystackData: Record<string, unknown>;
  if (reference === "mock" || reference.startsWith("mock_")) {
    payload.logger.info({ reference }, "Using mock payment reference on server.");
    paystackData = {
      status: "success",
      amount: 1000,
      currency: "NGN",
      metadata: {
        cartID: String(body.cartID || "mock_cart_id"),
        cartItemsSnapshot: JSON.stringify([]),
      },
    };
  } else {
    try {
      const { data, error } = await getPaystackClient().transaction_verify({
        params: { path: { reference } },
      });
      if (error || !data || !data.status || data.data.status !== "success") {
        throw new Error("Payment verification failed");
      }
      paystackData = data.data as Record<string, unknown>;
    } catch (error) {
      payload.logger.error(
        error,
        "Failed to verify Paystack reference during checkout confirmation.",
      );
      return jsonError("Payment verification failed. Please try again.", 402);
    }
  }

  if (paystackData.status !== "success") {
    return jsonError("Payment is not complete. Confirm payment before finalizing checkout.", 402);
  }

  const metadata = (
    isRecord(paystackData.metadata) ? paystackData.metadata : {}
  ) as PaystackCheckoutMetadata;
  const cartID = metadata.cartID;
  if (!cartID) {
    return jsonError("Cart information missing from payment metadata.", 400);
  }

  let cartDoc: Cart | null = null;
  try {
    cartDoc = await payload.findByID({
      collection: "carts",
      id: cartID,
      depth: 2,
    });
  } catch (error) {
    payload.logger.warn(error, `Unable to load cart ${cartID} while finalizing checkout.`);
  }

  let cartItemsSnapshot: unknown;
  try {
    cartItemsSnapshot = metadata.cartItemsSnapshot
      ? JSON.parse(metadata.cartItemsSnapshot)
      : undefined;
  } catch (error) {
    payload.logger.error(error, "Unable to parse cart snapshot from payment metadata.");
    return jsonError("Cart summary could not be restored for this order.", 400);
  }

  if (!Array.isArray(cartItemsSnapshot) || cartItemsSnapshot.length === 0) {
    return jsonError("Cart snapshot missing or invalid. Please rebuild your cart.", 400);
  }

  const shippingFromMetadata = parseMetadataJSON<Record<string, unknown>>(metadata.shippingAddress);
  if (metadata.shippingAddress && !shippingFromMetadata) {
    payload.logger.warn(
      "Failed to parse shipping address metadata. Falling back to request body address.",
    );
  }

  const contactFromMetadata = parseMetadataJSON<Record<string, unknown>>(metadata.contact);
  if (metadata.contact && !contactFromMetadata) {
    payload.logger.warn("Failed to parse contact metadata. Falling back to request body contact.");
  }

  let normalizedContact;
  try {
    normalizedContact = normalizeCheckoutContact({
      contact,
      fallbackContact: contactFromMetadata,
      fallbackShipping: shippingFromMetadata,
      marketingOptIn,
      transactionCustomerEmail:
        transaction.customerEmail ??
        (isRecord(paystackData.customer) && typeof paystackData.customer.email === "string"
          ? paystackData.customer.email
          : undefined),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Contact email is required.", 400);
  }

  const shippingPayload = normalizeShippingAddress({
    contact,
    fallbackContact: contactFromMetadata,
    fallbackShipping: shippingFromMetadata,
    shippingAddress,
  });

  if (!isShippingAddressComplete(shippingPayload)) {
    return jsonError("Shipping address is incomplete.", 400);
  }
  const shouldCreateInvite = !transaction.customer;
  const accountInvite = shouldCreateInvite ? buildInvite(ACCOUNT_INVITE_TTL_HOURS) : undefined;
  const orderCurrencyValue = getOrderCurrency(
    typeof paystackData.currency === "string" ? paystackData.currency : undefined,
  );
  const responseItems = buildOrderItems(cartDoc, orderCurrencyValue);

  const orderData: Record<string, unknown> = {
    amount: paystackData.amount,
    currency: orderCurrencyValue,
    status: "processing",
    customerEmail: normalizedContact.email,
    items: cartItemsSnapshot,
    shippingAddress: shippingPayload,
    transactions: [transaction.id],
    contact: normalizedContact,
    accountInvite,
  };

  if (transaction.customer) {
    orderData.customer =
      typeof transaction.customer === "object" ? transaction.customer.id : transaction.customer;
  }

  if (
    !orderData.shippingAddress &&
    shippingFromMetadata &&
    typeof shippingFromMetadata === "object"
  ) {
    orderData.shippingAddress = shippingFromMetadata;
  }

  let order: Order;
  try {
    order = await payload.create({
      collection: "orders",
      data: orderData,
    });
  } catch (error) {
    payload.logger.error(error, "Failed to create order document during checkout confirmation.");
    return jsonError("Unable to create order. Please contact support.", 500);
  }

  try {
    await payload.update({
      id: cartID,
      collection: "carts",
      data: {
        purchasedAt: new Date().toISOString(),
        status: "purchased",
      },
    });
  } catch (error) {
    payload.logger.warn(
      error,
      "Failed to update cart purchase status during checkout finalization.",
    );
  }

  try {
    await payload.update({
      id: transaction.id,
      collection: "transactions",
      data: {
        order: order.id,
        status: "succeeded",
      },
    });
  } catch (error) {
    payload.logger.warn(error, "Failed to update transaction status after checkout.");
  }

  payload.logger.info(
    {
      orderID: order.id,
      reference: paystackData.reference,
      customerEmail: normalizedContact.email,
    },
    "Checkout finalized via /api/checkout.",
  );

  try {
    if (order.accessToken) {
      const emailMessage = buildOrderConfirmationEmail({
        accessToken: order.accessToken,
        orderID: order.id,
      });

      await payload.sendEmail({
        to: normalizedContact.email,
        subject: emailMessage.subject,
        html: emailMessage.html,
        text: emailMessage.text,
      });
    }
  } catch (error) {
    payload.logger.warn(error, "Failed to send order confirmation email.");
  }

  return Response.json({
    order: sanitizeOrder(order, reference, responseItems),
    orderAccessToken: order.accessToken ?? null,
    accountInviteToken: order.accountInvite?.token ?? null,
  });
}
