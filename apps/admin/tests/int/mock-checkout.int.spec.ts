import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPayloadMock = vi.fn();
const headersMock = vi.fn();

vi.mock("@payload-config", () => ({
  default: {},
}));

vi.mock("payload", () => ({
  getPayload: getPayloadMock,
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

const { POST: mockCreateOrderPOST } = await import("@/app/api/test/create-order/route");

type MockPayload = {
  auth: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  logger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
};

const buildMockPayload = (): MockPayload => ({
  auth: vi.fn(),
  create: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
});

function buildRequest<T>(body: T): NextRequest {
  return {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === "x-e2e-test-secret") return "test-secret";
        return null;
      },
    },
    json: async () => body,
    nextUrl: new URL("http://localhost:8787/api/test/create-order"),
  } as unknown as NextRequest;
}

describe("mock checkout API", () => {
  let mockPayload: MockPayload;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_MOCK_CHECKOUT", undefined);
    vi.stubEnv("NEXT_PUBLIC_E2E_TEST_SECRET", undefined);

    mockPayload = buildMockPayload();
    mockPayload.auth.mockResolvedValue({ user: null });
    getPayloadMock.mockResolvedValue(mockPayload);
    headersMock.mockResolvedValue(new Headers());
  });

  it("uses the request currency and derives totals from NGN prices", async () => {
    mockPayload.create.mockImplementation(async ({ data }) => ({
      id: 77,
      createdAt: "2026-03-09T10:00:00.000Z",
      ...data,
    }));

    const response = await mockCreateOrderPOST(
      buildRequest({
        contact: {
          email: "buyer@example.com",
          firstName: "Ada",
          lastName: "Okafor",
        },
        shippingAddress: {
          addressLine1: "8 Broad Street",
          city: "Lagos",
          postalCode: "100001",
          country: "NG",
        },
        currency: "NGN",
        items: [
          {
            product: {
              id: 101,
              title: "Weekend Tote",
              priceInUSD: 3500,
              priceInNGN: 550000,
            },
            quantity: 2,
          },
        ],
      }),
    );

    const json = (await response.json()) as {
      order: {
        amount?: number;
        currency?: string | null;
      };
    };

    expect(response.status).toBe(200);
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "orders",
        data: expect.objectContaining({
          amount: 1100000,
          currency: "NGN",
        }),
      }),
    );
    expect(json.order.amount).toBe(1100000);
    expect(json.order.currency).toBe("NGN");
  });
});
