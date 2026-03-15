import { NextRequest } from "next/server";
import { describe, it, beforeEach, expect, vi } from "vitest";

import type { Order } from "@/payload-types";

const transactionVerify = vi.fn();
const getPayloadMock = vi.fn();

vi.mock("@payload-config", () => ({
  default: {},
}));

vi.mock("payload", () => ({
  getPayload: getPayloadMock,
}));

vi.mock("@alexasomba/paystack-node", () => ({
  createPaystack: vi.fn().mockImplementation(() => ({
    transaction_verify: (args: unknown) => transactionVerify(args),
  })),
}));

globalThis.PAYSTACK_SECRET_KEY = "sk_test_mock";
process.env.PAYSTACK_SECRET_KEY = "sk_test_mock";
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = "pk_test_mock";

// Import after mocks are registered
const { POST: checkoutPOST } = await import("@/app/api/checkout/route");
const { POST: accountPOST } = await import("@/app/api/checkout/account/route");

type MockPayload = {
  find: ReturnType<typeof vi.fn>;
  findByID: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  logger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
};

type CartSnapshotItem = NonNullable<Order["items"]>[number];

const buildMockPayload = (): MockPayload => ({
  find: vi.fn(),
  findByID: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
});

const futureDateISO = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

function buildRequest<T>(body: T): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

describe("checkout API", () => {
  let mockPayload: MockPayload;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = buildMockPayload();
    getPayloadMock.mockResolvedValue(mockPayload);
  });

  it("creates an order and invite token after a successful payment", async () => {
    const reference = "ref_123";
    const cartId = 123;

    const cartItemsSnapshot = [
      {
        id: "line_1",
        quantity: 1,
        product: { id: "product_1", title: "Sneakers", priceInUSD: 12900 },
      },
    ];

    const cartDocument = {
      id: cartId,
      items: cartItemsSnapshot,
    };

    const transaction = {
      id: 456,
      status: "pending",
      cart: cartDocument,
      paystack: { reference },
      order: null,
      customer: null,
    };

    const createdOrder: Partial<Order> = {
      id: 789,
      status: "processing",
      amount: 12900,
      currency: "USD",
      customerEmail: "guest@example.com",
      shippingAddress: {
        firstName: "Guest",
        lastName: "Shopper",
        addressLine1: "123 Commerce Ave",
        city: "Commerce City",
        postalCode: "90000",
        state: "CA",
        country: "US",
      },
      contact: {
        email: "guest@example.com",
        firstName: "Guest",
        lastName: "Shopper",
        marketingOptIn: true,
      },
      accountInvite: {
        token: "invite-token",
        expiresAt: futureDateISO(),
      },
      transactions: [transaction.id],
    };

    mockPayload.find.mockImplementation(async ({ collection }) => {
      if (collection === "transactions") {
        return {
          docs: [transaction],
          totalDocs: 1,
        };
      }
      return { docs: [], totalDocs: 0 };
    });

    mockPayload.findByID.mockResolvedValue(cartDocument);
    mockPayload.create.mockResolvedValue(createdOrder);
    mockPayload.update.mockResolvedValue(undefined);

    transactionVerify.mockImplementation(async () => {
      return {
        data: {
          status: true,
          data: {
            reference,
            status: "success",
            amount: 12900,
            currency: "usd",
            metadata: {
              cartID: String(cartId),
              cartItemsSnapshot: JSON.stringify(cartItemsSnapshot),
              shippingAddress: JSON.stringify(createdOrder.shippingAddress),
            },
          },
        },
        error: null,
      };
    });

    const body = {
      paymentData: { reference },
      marketingOptIn: true,
      contact: {
        email: "guest@example.com",
        firstName: "Guest",
        lastName: "Shopper",
        phone: "555-1234",
      },
      shippingAddress: {
        firstName: "Guest",
        lastName: "Shopper",
        addressLine1: "123 Commerce Ave",
        city: "Commerce City",
        postalCode: "90000",
        state: "CA",
        country: "US",
        phone: "555-1234",
      },
    };

    const response = await checkoutPOST(buildRequest(body));

    const payload = (await response.json()) as {
      order: unknown;
      accountInviteToken: string | null;
    };
    expect(response.status).toBe(200);

    expect(payload.order).toBeDefined();
    expect(payload.accountInviteToken).toBe("invite-token");

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "orders",
        data: expect.objectContaining({
          contact: expect.objectContaining({
            email: "guest@example.com",
            marketingOptIn: true,
          }),
          accountInvite: expect.objectContaining({ token: expect.any(String) }),
        }),
      }),
    );

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "carts",
        id: String(cartId),
        data: expect.objectContaining({
          status: "purchased",
          purchasedAt: expect.any(String),
        }),
      }),
    );

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "transactions",
        id: transaction.id,
        data: expect.objectContaining({
          order: createdOrder.id,
          status: "succeeded",
        }),
      }),
    );
  });

  it("fails when cart snapshot cannot be restored", async () => {
    const reference = "ref_456";
    const cartId = 456;

    const transaction = {
      id: 457,
      status: "pending",
      cart: null,
      paystack: { reference },
      order: null,
      customer: null,
    };

    mockPayload.find.mockResolvedValue({
      docs: [transaction],
      totalDocs: 1,
    });

    mockPayload.findByID.mockResolvedValue(null);

    transactionVerify.mockResolvedValue({
      data: {
        status: true,
        data: {
          reference,
          status: "success",
          metadata: {
            cartID: String(cartId),
            cartItemsSnapshot: '{"invalid": true}',
          },
        },
      },
      error: null,
    });

    const body = {
      paymentData: { reference },
      marketingOptIn: false,
      contact: {
        email: "guest@example.com",
      },
      shippingAddress: {
        addressLine1: "123 Commerce Ave",
        city: "Commerce City",
        postalCode: "90000",
        country: "US",
      },
    };

    const response = await checkoutPOST(buildRequest(body));

    const json = (await response.json()) as { error: string };
    expect(response.status).toBe(400);
    expect(json.error).toMatch(/Cart snapshot missing or invalid/);
  });

  it("falls back to NGN when payment verification does not include a currency", async () => {
    const reference = "ref_ngn_default";
    const cartId = 999;

    const cartItemsSnapshot = [
      {
        id: "line_ngn_1",
        quantity: 2,
        product: { id: "product_ngn_1", title: "Slides", priceInNGN: 250000 },
      },
    ];

    const cartDocument = {
      id: cartId,
      items: cartItemsSnapshot,
    };

    const transaction = {
      id: 654,
      status: "pending",
      cart: cartDocument,
      paystack: { reference },
      order: null,
      customer: null,
    };

    const createdOrder: Partial<Order> = {
      id: 321,
      status: "processing",
      amount: 500000,
      currency: "NGN",
      customerEmail: "shopper@example.com",
      items: cartItemsSnapshot as unknown as CartSnapshotItem[],
      shippingAddress: {
        addressLine1: "12 Marina Road",
        city: "Lagos",
        postalCode: "100001",
        state: "LA",
        country: "NG",
      },
      contact: {
        email: "shopper@example.com",
      },
      accountInvite: {
        token: "invite-ngn",
        expiresAt: futureDateISO(),
      },
      transactions: [transaction.id],
    };

    mockPayload.find.mockImplementation(async ({ collection }) => {
      if (collection === "transactions") {
        return {
          docs: [transaction],
          totalDocs: 1,
        };
      }
      return { docs: [], totalDocs: 0 };
    });

    mockPayload.findByID.mockResolvedValue(cartDocument);
    mockPayload.create.mockResolvedValue(createdOrder);
    mockPayload.update.mockResolvedValue(undefined);

    transactionVerify.mockResolvedValue({
      data: {
        status: true,
        data: {
          reference,
          status: "success",
          amount: 500000,
          metadata: {
            cartID: String(cartId),
            cartItemsSnapshot: JSON.stringify(
              cartItemsSnapshot.map(({ id, quantity, product }) => ({
                id,
                quantity,
                product: product.id,
              })),
            ),
            shippingAddress: JSON.stringify(createdOrder.shippingAddress),
          },
        },
      },
      error: null,
    });

    const response = await checkoutPOST(
      buildRequest({
        paymentData: { reference },
        contact: { email: "shopper@example.com" },
        shippingAddress: {
          addressLine1: "12 Marina Road",
          city: "Lagos",
          postalCode: "100001",
          country: "NG",
        },
      }),
    );

    const payload = (await response.json()) as {
      order: {
        currency?: string | null;
        items?: Array<{ unitPrice?: number | null }>;
      };
    };

    expect(response.status).toBe(200);
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "orders",
        data: expect.objectContaining({
          currency: "NGN",
        }),
      }),
    );
    expect(payload.order.currency).toBe("NGN");
    expect(payload.order.items?.[0]?.unitPrice).toBe(250000);
  });

  it("finalizes checkout from Paystack metadata when callback returns without request contact data", async () => {
    const reference = "ref_callback_only";
    const cartId = 111;

    const transaction = {
      id: 852,
      status: "pending",
      cart: null,
      paystack: { reference },
      order: null,
      customer: null,
      customerEmail: "callback@example.com",
    };

    const createdOrder: Partial<Order> = {
      id: 963,
      status: "processing",
      amount: 150000,
      currency: "NGN",
      customerEmail: "callback@example.com",
      shippingAddress: {
        firstName: "Callback",
        lastName: "User",
        addressLine1: "42 Adeola Odeku",
        city: "Lagos",
        postalCode: "101241",
        state: "LA",
        country: "NG",
      },
      contact: {
        email: "callback@example.com",
        firstName: "Callback",
        lastName: "User",
      },
      accountInvite: {
        token: "invite-callback",
        expiresAt: futureDateISO(),
      },
      transactions: [transaction.id],
    };

    mockPayload.find.mockResolvedValue({
      docs: [transaction],
      totalDocs: 1,
    });
    mockPayload.findByID.mockResolvedValue(null);
    mockPayload.create.mockResolvedValue(createdOrder);
    mockPayload.update.mockResolvedValue(undefined);

    transactionVerify.mockResolvedValue({
      data: {
        status: true,
        data: {
          reference,
          status: "success",
          amount: 150000,
          currency: "ngn",
          customer: {
            email: "callback@example.com",
          },
          metadata: {
            cartID: String(cartId),
            cartItemsSnapshot: JSON.stringify([
              {
                id: "line_cb_1",
                quantity: 1,
                product: "product_cb_1",
              },
            ]),
            contact: JSON.stringify({
              email: "callback@example.com",
              firstName: "Callback",
              lastName: "User",
            }),
            shippingAddress: JSON.stringify(createdOrder.shippingAddress),
          },
        },
      },
      error: null,
    });

    const response = await checkoutPOST(
      buildRequest({
        paymentData: { reference },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "orders",
        data: expect.objectContaining({
          customerEmail: "callback@example.com",
          contact: expect.objectContaining({
            email: "callback@example.com",
            firstName: "Callback",
          }),
          shippingAddress: expect.objectContaining({
            addressLine1: "42 Adeola Odeku",
            country: "NG",
          }),
        }),
      }),
    );
  });
});

describe("checkout account conversion API", () => {
  let mockPayload: MockPayload;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = buildMockPayload();
    getPayloadMock.mockResolvedValue(mockPayload);
  });

  it("creates a customer account when invite is valid", async () => {
    const inviteToken = "invite-token";
    const orderId = 321;
    const userId = 654;

    const orderDocument = {
      id: orderId,
      customerEmail: "guest@example.com",
      contact: {
        email: "guest@example.com",
        firstName: "Guest",
        lastName: "Shopper",
        marketingOptIn: false,
      },
      accountInvite: {
        token: inviteToken,
        expiresAt: futureDateISO(),
        redeemedAt: null,
      },
      transactions: ["txn_abc"],
    };

    mockPayload.find.mockImplementation(async ({ collection }) => {
      if (collection === "orders") {
        return {
          docs: [orderDocument],
          totalDocs: 1,
        };
      }
      if (collection === "users") {
        return {
          docs: [],
          totalDocs: 0,
        };
      }
      return { docs: [], totalDocs: 0 };
    });

    mockPayload.create.mockResolvedValue({ id: userId });
    mockPayload.update.mockResolvedValue(undefined);

    const response = await accountPOST(
      buildRequest({
        accountInviteToken: inviteToken,
        password: "strong-pass",
        marketingOptIn: true,
      }),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as { message: string };
    expect(json.message).toMatch(/Account created/);

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        data: expect.objectContaining({
          email: "guest@example.com",
          roles: ["customer"],
          _verified: true,
        }),
      }),
    );

    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "orders",
        id: orderId,
        data: expect.objectContaining({
          accountInvite: expect.objectContaining({ redeemedAt: expect.any(String) }),
          contact: expect.objectContaining({ marketingOptIn: true }),
        }),
      }),
    );
  });

  it("rejects invite when user already exists", async () => {
    const inviteToken = "invite-token";

    const orderDocument = {
      id: "order_existing",
      customerEmail: "guest@example.com",
      contact: {
        email: "guest@example.com",
      },
      accountInvite: {
        token: inviteToken,
        expiresAt: futureDateISO(),
        redeemedAt: null,
      },
      transactions: [],
    };

    mockPayload.find.mockImplementation(async ({ collection }) => {
      if (collection === "orders") {
        return {
          docs: [orderDocument],
          totalDocs: 1,
        };
      }
      if (collection === "users") {
        return {
          docs: [{ id: "user_existing" }],
          totalDocs: 1,
        };
      }
      return { docs: [], totalDocs: 0 };
    });

    const response = await accountPOST(
      buildRequest({
        accountInviteToken: inviteToken,
        password: "strong-pass",
      }),
    );

    expect(response.status).toBe(400);
    const json = (await response.json()) as { error: string };
    expect(json.error).toMatch(/An account already exists/);
  });
});
