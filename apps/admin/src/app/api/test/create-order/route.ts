import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import configPromise from "@payload-config";
import { getPayload } from "payload";

import type { Order, Product, Variant } from "@/payload-types";
import { DEFAULT_CURRENCY, type SupportedCurrencyCode } from "@/config/currencies";

const ACCOUNT_INVITE_TTL_HOURS = 72;

type ContactPayload = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

type AddressPayload = {
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
};

type CartItemPayload = {
  product?: unknown;
  variant?: unknown;
  quantity?: unknown;
};

type MockCheckoutRequest = {
  contact?: ContactPayload;
  customerEmail?: string | null;
  shippingAddress?: AddressPayload;
  billingAddress?: AddressPayload;
  marketingOptIn?: boolean;
  items?: CartItemPayload[];
  amount?: number;
  currency?: string | null;
};

type ErrorResponse = {
  error: string;
};

type SanitizedOrder = Pick<
  Order,
  | "id"
  | "amount"
  | "currency"
  | "status"
  | "createdAt"
  | "customerEmail"
  | "items"
  | "shippingAddress"
  | "contact"
  | "accountInvite"
>;

function jsonError(message: string, status: number) {
  const payload: ErrorResponse = { error: message };
  return Response.json(payload, { status });
}

function extractID(entity: unknown): string | number | null {
  if (entity == null) return null;

  if (typeof entity === "string" || typeof entity === "number") {
    return entity;
  }

  if (typeof entity === "object" && "id" in (entity as Record<string, unknown>)) {
    const candidate = (entity as Record<string, unknown>).id;
    if (typeof candidate === "string" || typeof candidate === "number") {
      return candidate;
    }
  }

  return null;
}

function extractUnitPrice(
  rawItem: CartItemPayload,
  currency: SupportedCurrencyCode,
): number | null {
  const priceField = `priceIn${currency}` as keyof Variant & keyof Product;
  const variant = rawItem.variant as Variant | null | undefined;
  if (variant && typeof variant === "object" && typeof variant?.[priceField] === "number") {
    return variant[priceField] as number;
  }

  const product = rawItem.product as Product | null | undefined;
  if (product && typeof product === "object" && typeof product?.[priceField] === "number") {
    return product[priceField] as number;
  }

  return null;
}

function normalizeCurrency(value?: string | null): SupportedCurrencyCode {
  const normalized = value?.toUpperCase();

  if (normalized === "USD" || normalized === "NGN") {
    return normalized;
  }

  return DEFAULT_CURRENCY;
}

function buildInvite(expiresInHours: number) {
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  return {
    token: randomUUID(),
    expiresAt: expiresAt.toISOString(),
  };
}

function sanitizeOrder(order: Order): SanitizedOrder {
  return {
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
}

import { getMockCheckoutStatus } from "@/utilities/isMockCheckout";
import { headers as nextHeaders } from "next/headers";

export async function POST(request: NextRequest) {
  const headers = await nextHeaders();
  if (!getMockCheckoutStatus(request.nextUrl.hostname)) {
    return jsonError("Mock checkout endpoint is disabled.", 403);
  }

  const testSecret = request.headers.get("x-e2e-test-secret");
  const expectedSecret = process.env.NEXT_PUBLIC_E2E_TEST_SECRET || "test-secret";

  if (!testSecret || testSecret !== expectedSecret) {
    return jsonError("Unauthorized.", 401);
  }

  let body: MockCheckoutRequest;

  try {
    body = (await request.json()) as MockCheckoutRequest;
  } catch (_error) {
    return jsonError("Invalid JSON payload.", 400);
  }

  if (!body || typeof body !== "object") {
    return jsonError("Invalid mock checkout payload.", 400);
  }

  const { contact, shippingAddress, marketingOptIn = false, items = [], amount } = body;
  const contactEmail = contact?.email ?? body.customerEmail;
  const currency: NonNullable<Order["currency"]> = normalizeCurrency(body.currency);

  if (!contactEmail) {
    return jsonError("Contact email is required.", 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    return jsonError("Cart items are required to create an order.", 400);
  }

  const sanitizedItems = items
    .map((item) => {
      const productId = extractID(item.product);
      if (productId == null) return null;

      const variantId = extractID(item.variant);
      const quantity = typeof item.quantity === "number" ? item.quantity : Number(item.quantity);
      const resolvedQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

      return {
        product: productId,
        variant: variantId,
        quantity: resolvedQuantity,
      };
    })
    .filter(
      (
        value,
      ): value is { product: string | number; variant: string | number | null; quantity: number } =>
        value !== null,
    );

  if (sanitizedItems.length === 0) {
    return jsonError("No valid cart items were provided.", 400);
  }

  const derivedAmount = sanitizedItems.reduce((total, item, index) => {
    const unitPrice = extractUnitPrice(items[index], currency);
    if (typeof unitPrice === "number") {
      return total + unitPrice * item.quantity;
    }
    return total;
  }, 0);

  const resolvedAmount =
    typeof amount === "number" && !Number.isNaN(amount) ? amount : derivedAmount;

  if (!resolvedAmount || resolvedAmount <= 0) {
    return jsonError("Order total amount could not be determined.", 400);
  }

  const invite = buildInvite(ACCOUNT_INVITE_TTL_HOURS);

  const normalizedShippingAddress: AddressPayload = {
    ...shippingAddress,
    firstName: shippingAddress?.firstName ?? contact?.firstName ?? null,
    lastName: shippingAddress?.lastName ?? contact?.lastName ?? null,
    phone: shippingAddress?.phone ?? contact?.phone ?? null,
  };

  const normalizedContact = {
    email: contactEmail,
    firstName: contact?.firstName ?? shippingAddress?.firstName ?? null,
    lastName: contact?.lastName ?? shippingAddress?.lastName ?? null,
    phone: contact?.phone ?? shippingAddress?.phone ?? null,
    marketingOptIn,
  };

  const payload = await getPayload({ config: configPromise });
  const { user } = await payload.auth({ headers });
  if (user) {
    payload.logger.info({ userId: user.id }, "Authenticated user found for mock order.");
  } else {
    payload.logger.warn("No authenticated user found for mock order.");
  }

  try {
    const order = await payload.create({
      collection: "orders",
      depth: 2,
      data: {
        amount: resolvedAmount,
        currency,
        status: "processing",
        customerEmail: contactEmail,
        customer: user?.id,
        items: sanitizedItems.map((item) => ({
          product: item.product as number,
          variant: item.variant as number | null,
          quantity: item.quantity,
        })),
        shippingAddress: normalizedShippingAddress,
        contact: normalizedContact,
        accountInvite: {
          token: invite.token,
          expiresAt: invite.expiresAt,
        },
        transactions: [],
      },
    });

    payload.logger.info(
      {
        orderID: order.id,
        customerEmail: contactEmail,
      },
      "Mock checkout order created for E2E test.",
    );

    return Response.json({
      order: sanitizeOrder(order),
      accountInviteToken: order.accountInvite?.token ?? invite.token,
    });
  } catch (error) {
    payload.logger.error(error, "Failed to create mock checkout order.");
    return jsonError("Unable to create mock order. Please retry.", 500);
  }
}
