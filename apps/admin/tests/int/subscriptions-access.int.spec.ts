import { beforeEach, describe, expect, it, vi } from "vitest";

import { Subscriptions } from "@/collections/Subscriptions";

vi.mock("@payload-config", () => ({
  default: {},
}));

const authMock = vi.fn();
const findByIDMock = vi.fn();
const getPayloadMock = vi.fn();
const updateMock = vi.fn();

vi.mock("payload", () => ({
  getPayload: getPayloadMock,
}));

vi.mock("next/headers.js", () => ({
  headers: vi.fn(async () => new Headers()),
}));

const getCollectionAccess = (operation: keyof NonNullable<typeof Subscriptions.access>) => {
  const access = Subscriptions.access?.[operation];

  if (typeof access !== "function") {
    throw new Error(`Missing subscriptions access function for ${operation}`);
  }

  return access;
};

describe("subscriptions access", () => {
  it("scopes read and update access to the owning customer", () => {
    const readAccess = getCollectionAccess("read");
    const updateAccess = getCollectionAccess("update");

    expect(
      readAccess({
        req: { user: { id: 12, roles: ["customer"] } },
      } as never),
    ).toEqual({
      customer: {
        equals: 12,
      },
    });

    expect(
      updateAccess({
        req: { user: { id: 12, roles: ["customer"] } },
      } as never),
    ).toEqual({
      customer: {
        equals: 12,
      },
    });
  });

  it("keeps delete access admin-only", () => {
    const deleteAccess = getCollectionAccess("delete");

    expect(
      deleteAccess({
        req: { user: { id: 12, roles: ["customer"] } },
      } as never),
    ).toBe(false);
  });
});

describe("POST /api/subscriptions/[id]/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockReset();
    findByIDMock.mockReset();
    updateMock.mockReset();

    getPayloadMock.mockResolvedValue({
      auth: authMock,
      findByID: findByIDMock,
      update: updateMock,
    });
  });

  it("uses the authenticated user context when loading and updating the subscription", async () => {
    const user = { id: 44, roles: ["customer"] };
    authMock.mockResolvedValue({ user });
    findByIDMock.mockResolvedValue({ id: 8, customer: 44 });
    updateMock.mockResolvedValue({ id: 8, status: "cancelled" });

    const { POST } = await import("@/app/api/subscriptions/[id]/cancel/route");
    const response = await POST(new Request("http://localhost/api/subscriptions/8/cancel"), {
      params: Promise.resolve({ id: "8" }),
    });

    expect(response.status).toBe(303);
    expect(findByIDMock).toHaveBeenCalledWith({
      collection: "subscriptions",
      id: 8,
      user,
      overrideAccess: false,
    });
    expect(updateMock).toHaveBeenCalledWith({
      collection: "subscriptions",
      id: 8,
      data: { status: "cancelled" },
      user,
      overrideAccess: false,
    });
  });
});
