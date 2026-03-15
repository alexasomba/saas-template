import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@payload-config", () => ({
  default: {},
}));

const findMock = vi.fn();
const getPayloadMock = vi.fn();

type MockPayload = {
  find: typeof findMock;
};

vi.mock("payload", () => ({
  getPayload: getPayloadMock,
}));

const buildRequest = (url: string) => new NextRequest(url);

describe("GET /api/store-products", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    findMock.mockReset();
    getPayloadMock.mockReset();
    const mockPayload: MockPayload = {
      find: findMock,
    };

    getPayloadMock.mockResolvedValue(mockPayload);

    findMock.mockResolvedValue({
      docs: [
        {
          id: "product_1",
          title: "Test Product",
        },
      ],
      hasNextPage: true,
      nextPage: 2,
    });
  });

  it("returns products applying search and category filters", async () => {
    const { GET } = await import("@/app/api/store-products/route");

    const response = await GET(
      buildRequest(
        "http://localhost/api/store-products?search=sneaker&category=shoes&limit=2&cursor=1",
      ),
    );

    expect(response.status).toBe(200);
    expect(findMock).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        limit: 2,
        page: 1,
        depth: 0,
        where: {
          and: [
            {
              _status: {
                equals: "published",
              },
            },
            {
              or: [
                {
                  title: {
                    like: "sneaker",
                  },
                },
                {
                  slug: {
                    like: "sneaker",
                  },
                },
              ],
            },
            {
              categories: {
                contains: "shoes",
              },
            },
          ],
        },
      }),
    );

    const payload = (await response.json()) as {
      items: unknown[];
      nextCursor: string | null;
    };
    expect(payload.items).toHaveLength(1);
    expect(payload.nextCursor).toBe("2");
  });

  it("enforces limit bounds", async () => {
    const { GET } = await import("@/app/api/store-products/route");

    const response = await GET(buildRequest("http://localhost/api/store-products?limit=0"));

    expect(response.status).toBe(400);
    expect(findMock).not.toHaveBeenCalled();
  });

  it("returns 500 when payload lookup fails", async () => {
    const { GET } = await import("@/app/api/store-products/route");
    findMock.mockRejectedValueOnce(new Error("payload failure"));

    const response = await GET(buildRequest("http://localhost/api/store-products"));

    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Unable to fetch products.");
  });
});
