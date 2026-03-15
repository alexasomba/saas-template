import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPayloadMock = vi.fn();

vi.mock("@payload-config", () => ({
  default: {},
}));

vi.mock("payload", () => ({
  getPayload: getPayloadMock,
}));

const { POST: verifyEmailPOST } = await import("@/app/api/auth/verify-email/route");

type MockPayload = {
  find: ReturnType<typeof vi.fn>;
  verifyEmail: ReturnType<typeof vi.fn>;
};

const buildMockPayload = (): MockPayload => ({
  find: vi.fn(),
  verifyEmail: vi.fn(),
});

function buildRequest<T>(body: T): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

describe("verify email route", () => {
  let mockPayload: MockPayload;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = buildMockPayload();
    getPayloadMock.mockResolvedValue(mockPayload);
  });

  it("returns verified when payload verifies the token", async () => {
    mockPayload.verifyEmail.mockResolvedValue(true);

    const response = await verifyEmailPOST(
      buildRequest({
        token: "valid-token",
        email: "person@example.com",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "verified",
      message: "Email verified successfully.",
    });
    expect(mockPayload.verifyEmail).toHaveBeenCalledWith({
      collection: "users",
      token: "valid-token",
    });
  });

  it("returns already_verified when the token is consumed but the user is verified", async () => {
    mockPayload.verifyEmail.mockRejectedValue(new Error("Verification token is invalid."));
    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 1,
          email: "person@example.com",
          _verified: true,
        },
      ],
    });

    const response = await verifyEmailPOST(
      buildRequest({
        token: "used-token",
        email: "person@example.com",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "already_verified",
      message: "Email already verified. Please sign in.",
    });
    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        overrideAccess: true,
        where: {
          email: {
            equals: "person@example.com",
          },
        },
      }),
    );
  });

  it("returns invalid for an unknown email when the token is invalid", async () => {
    mockPayload.verifyEmail.mockRejectedValue(new Error("Verification token is invalid."));
    mockPayload.find.mockResolvedValue({
      docs: [],
    });

    const response = await verifyEmailPOST(
      buildRequest({
        token: "bad-token",
        email: "unknown@example.com",
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Verification token is invalid.",
    });
  });

  it("returns invalid for an unverified user when the token is invalid", async () => {
    mockPayload.verifyEmail.mockRejectedValue(new Error("Verification token is invalid."));
    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 2,
          email: "person@example.com",
          _verified: false,
        },
      ],
    });

    const response = await verifyEmailPOST(
      buildRequest({
        token: "bad-token",
        email: "person@example.com",
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Verification token is invalid.",
    });
  });
});
