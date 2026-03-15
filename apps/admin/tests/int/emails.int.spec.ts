import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendWelcomeEmail } from "@/collections/Users/hooks/sendWelcomeEmail";
import { sendOrderStatusEmail } from "@/collections/Orders/hooks/sendOrderStatusEmail";

describe("transactional email hooks", () => {
  const sendEmail = vi.fn();
  const warn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends welcome email when a user becomes verified", async () => {
    await sendWelcomeEmail({
      operation: "update",
      doc: {
        id: 1,
        email: "new@example.com",
        name: "New User",
        _verified: true,
      },
      previousDoc: {
        id: 1,
        email: "new@example.com",
        _verified: false,
      },
      req: {
        payload: {
          sendEmail,
          logger: { warn },
        },
      },
    } as never);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new@example.com",
        subject: "Welcome to AutomaticPallet.com",
      }),
    );
  });

  it("does not send welcome email for unverified users", async () => {
    await sendWelcomeEmail({
      operation: "create",
      doc: {
        id: 1,
        email: "new@example.com",
        _verified: false,
      },
      previousDoc: null,
      req: {
        payload: {
          sendEmail,
          logger: { warn },
        },
      },
    } as never);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends order status email when order status changes", async () => {
    await sendOrderStatusEmail({
      operation: "update",
      doc: {
        id: 77,
        accessToken: "order-token-77",
        status: "completed",
        contact: {
          email: "buyer@example.com",
        },
      },
      previousDoc: {
        id: 77,
        accessToken: "order-token-77",
        status: "processing",
        contact: {
          email: "buyer@example.com",
        },
      },
      req: {
        payload: {
          sendEmail,
          logger: { warn },
        },
      },
    } as never);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "buyer@example.com",
        subject: "Order #77 completed",
      }),
    );
  });

  it("does not send order status email when status is unchanged", async () => {
    await sendOrderStatusEmail({
      operation: "update",
      doc: {
        id: 77,
        status: "processing",
        customerEmail: "buyer@example.com",
      },
      previousDoc: {
        id: 77,
        status: "processing",
        customerEmail: "buyer@example.com",
      },
      req: {
        payload: {
          sendEmail,
          logger: { warn },
        },
      },
    } as never);

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
