import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@payload-config", () => ({
  default: {},
}));

const authMock = vi.fn();
const createMock = vi.fn();
const getPayloadMock = vi.fn();

vi.mock("payload", () => ({
  getPayload: getPayloadMock,
}));

const buildRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/store-products", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });

describe("POST /api/store-products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockReset();
    createMock.mockReset();

    getPayloadMock.mockResolvedValue({
      auth: authMock,
      create: createMock,
    });
  });

  it("rejects anonymous callers", async () => {
    authMock.mockResolvedValue({ user: null });

    const { POST } = await import("@/app/api/store-products/route");
    const response = await POST(buildRequest({ title: "Unsafe product" }));

    expect(response.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects non-admin callers", async () => {
    authMock.mockResolvedValue({ user: { id: 9, roles: ["customer"] } });

    const { POST } = await import("@/app/api/store-products/route");
    const response = await POST(buildRequest({ title: "Unsafe product" }));

    expect(response.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("enforces Payload access for admins", async () => {
    const adminUser = { id: 1, roles: ["admin"] };
    authMock.mockResolvedValue({ user: adminUser });
    createMock.mockResolvedValue({ id: 5, title: "Safe product" });

    const { POST } = await import("@/app/api/store-products/route");
    const response = await POST(buildRequest({ title: "Safe product" }));

    expect(response.status).toBe(200);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        user: adminUser,
        overrideAccess: false,
      }),
    );
  });
});
