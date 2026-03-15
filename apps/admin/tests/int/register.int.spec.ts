import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPayloadMock = vi.fn();

vi.mock("@payload-config", () => ({
  default: {},
}));

vi.mock("payload", () => ({
  getPayload: getPayloadMock,
}));

const { POST: registerPOST } = await import("@/app/api/auth/register/route");

type MockPayload = {
  create: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
  sendEmail: ReturnType<typeof vi.fn>;
};

const buildMockPayload = (): MockPayload => ({
  create: vi.fn(),
  find: vi.fn(),
  sendEmail: vi.fn(),
});

function buildRequest<T>(body: T): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: (name: string) => (name.toLowerCase() === "host" ? "localhost:8787" : null),
    },
  } as unknown as NextRequest;
}

describe("register route", () => {
  let mockPayload: MockPayload;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = buildMockPayload();
    getPayloadMock.mockResolvedValue(mockPayload);
  });

  it("creates a user and sends verification email without using the default verification sender", async () => {
    mockPayload.create.mockResolvedValue({
      id: 1,
      email: "new@example.com",
    });

    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 1,
          email: "new@example.com",
          _verificationToken: "verification-token",
        },
      ],
    });

    const response = await registerPOST(
      buildRequest({
        email: "new@example.com",
        password: "strong-pass-123",
        passwordConfirm: "strong-pass-123",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      emailSent: true,
      message: "Account created successfully. Check your email to verify your account.",
    });

    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        disableVerificationEmail: true,
        data: expect.objectContaining({
          email: "new@example.com",
          password: "strong-pass-123",
        }),
      }),
    );

    expect(mockPayload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new@example.com",
        subject: "Verify your email address",
      }),
    );
  });

  it("still creates the account when email delivery fails", async () => {
    mockPayload.create.mockResolvedValue({
      id: 1,
      email: "new@example.com",
    });

    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 1,
          email: "new@example.com",
          _verificationToken: "verification-token",
        },
      ],
    });

    mockPayload.sendEmail.mockRejectedValue(new Error("OneSignal Email Error"));

    const response = await registerPOST(
      buildRequest({
        email: "new@example.com",
        password: "strong-pass-123",
        passwordConfirm: "strong-pass-123",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      emailSent: false,
      message:
        "Account created, but we could not send the verification email right now. Please try verifying again later.",
      verificationToken: "verification-token",
    });
  });

  it("rejects mismatched passwords", async () => {
    const response = await registerPOST(
      buildRequest({
        email: "new@example.com",
        password: "strong-pass-123",
        passwordConfirm: "different-pass-123",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Passwords do not match.",
    });
    expect(mockPayload.create).not.toHaveBeenCalled();
  });
});
