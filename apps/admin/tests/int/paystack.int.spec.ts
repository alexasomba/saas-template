import { describe, it, expect, vi } from "vitest";
import { paystackAdapter } from "@/plugins/paystack";
import type { PayloadRequest } from "payload";
import type { Address, Order } from "@/payload-types";

const secretKey = "sk_test_mock";
const publicKey = "pk_test_mock";

vi.mock("@alexasomba/paystack-node", () => {
  const transaction_initialize = vi.fn().mockResolvedValue({
    data: {
      status: true,
      data: {
        authorization_url: "https://checkout.paystack.com/mock",
        reference: "mock_reference",
      },
    },
    error: null,
  });

  const transaction_verify = vi.fn().mockResolvedValue({
    data: {
      status: true,
      data: {
        status: "success",
        amount: 10000,
        currency: "NGN",
        customer: { email: "test@example.com" },
        metadata: {
          cartID: "123",
          cartItemsSnapshot: "[]",
          shippingAddress: "{}",
        },
      },
    },
    error: null,
  });

  return {
    createPaystack: vi.fn().mockReturnValue({
      transaction_initialize,
      transaction_verify,
    }),
  };
});

describe("Paystack Adapter", () => {
  const adapter = paystackAdapter({ secretKey, publicKey });

  it("should have the correct name", () => {
    expect(adapter.name).toBe("paystack");
  });

  it("should initiate payment", async () => {
    const mockPayload = {
      create: vi.fn().mockResolvedValue({ id: "txn_123" }),
      logger: { error: vi.fn() },
    };
    const req = { payload: mockPayload, user: { id: "user_123" } } as unknown as PayloadRequest;
    const shippingAddress: Address = {
      id: 1,
      country: "NG",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const data: Parameters<typeof adapter.initiatePayment>[0]["data"] & {
      contact?: Order["contact"];
    } = {
      billingAddress: shippingAddress,
      customerEmail: "test@example.com",
      currency: "NGN",
      cart: { id: 123, subtotal: 10000, items: [] },
      shippingAddress,
    };

    const result = await adapter.initiatePayment({ data, req, transactionsSlug: "transactions" });
    expect(result).toHaveProperty("reference", "mock_reference");
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "transactions",
        data: expect.objectContaining({
          paymentMethod: "paystack",
          paystack: {
            reference: "mock_reference",
          },
        }),
      }),
    );
  });

  it("should confirm order", async () => {
    const mockPayload = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: "txn_123" }], totalDocs: 1 }),
      create: vi.fn().mockResolvedValue({ id: "order_123" }),
      update: vi.fn().mockResolvedValue({ id: "updated_doc" }),
      logger: { error: vi.fn() },
    };
    const req = { payload: mockPayload, user: { id: "user_123" } } as unknown as PayloadRequest;
    const data = { reference: "mock_reference" };

    const result = await adapter.confirmOrder({
      data,
      req,
      transactionsSlug: "transactions",
      ordersSlug: "orders",
      cartsSlug: "carts",
    });

    expect(result).toHaveProperty("orderID", "order_123");
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "orders",
      }),
    );
    expect(mockPayload.update).toHaveBeenCalledTimes(2); // One for cart, one for transaction
  });
});
