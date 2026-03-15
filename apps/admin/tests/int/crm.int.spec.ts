import { describe, expect, it, vi, beforeEach } from "vitest";

import { sendFirstPurchaseCelebrationEmail } from "@/plugins/crm/sendFirstPurchaseCelebrationEmail";
import { runLifecycleCampaigns } from "@/plugins/crm/runLifecycleCampaigns";
import { runReminderCampaigns } from "@/plugins/crm/runReminderCampaigns";

type FirstPurchaseArgs = Parameters<typeof sendFirstPurchaseCelebrationEmail>[0];
type LifecycleArgs = Parameters<typeof runLifecycleCampaigns>[0];
type ReminderArgs = Parameters<typeof runReminderCampaigns>[0];
type MockPayload = NonNullable<LifecycleArgs["payload"]>;

describe("crm lifecycle automation", () => {
  const sendEmail = vi.fn();
  const create = vi.fn();
  const find = vi.fn();
  const logger = {
    warn: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    create.mockResolvedValue({ id: 1 });
  });

  it("celebrates a first-time buyer exactly once", async () => {
    find
      .mockResolvedValueOnce({ totalDocs: 0, docs: [] })
      .mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 101 }] });

    await sendFirstPurchaseCelebrationEmail({
      doc: {
        id: 101,
        accessToken: "order-token-101",
        customer: 23,
        customerEmail: "buyer@example.com",
        contact: {
          email: "buyer@example.com",
          marketingOptIn: true,
        },
      } as FirstPurchaseArgs["doc"],
      operation: "create",
      req: {
        payload: {
          create,
          find,
          logger,
          sendEmail,
        },
      } as unknown as FirstPurchaseArgs["req"],
    } as FirstPurchaseArgs);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Thanks for your first order",
        to: "buyer@example.com",
      }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "marketing-email-events",
        data: expect.objectContaining({
          campaign: "first-time-buyer",
          order: 101,
          recipientEmail: "buyer@example.com",
        }),
      }),
    );
  });

  it("does not celebrate repeat buyers", async () => {
    find.mockResolvedValueOnce({ totalDocs: 2, docs: [{ id: 101 }, { id: 99 }] });

    await sendFirstPurchaseCelebrationEmail({
      doc: {
        id: 101,
        accessToken: "order-token-101",
        customerEmail: "buyer@example.com",
        contact: {
          email: "buyer@example.com",
          marketingOptIn: true,
        },
      } as FirstPurchaseArgs["doc"],
      operation: "create",
      req: {
        payload: {
          create,
          find,
          logger,
          sendEmail,
        },
      } as unknown as FirstPurchaseArgs["req"],
    } as FirstPurchaseArgs);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("skips first-purchase email when the dedupe event already exists at create time", async () => {
    find.mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 101 }] });
    create.mockRejectedValueOnce(new Error("SQLITE_CONSTRAINT_UNIQUE: duplicate dedupe key"));

    await sendFirstPurchaseCelebrationEmail({
      doc: {
        id: 101,
        accessToken: "order-token-101",
        customerEmail: "buyer@example.com",
        contact: {
          email: "buyer@example.com",
          marketingOptIn: true,
        },
      } as FirstPurchaseArgs["doc"],
      operation: "create",
      req: {
        payload: {
          create,
          delete: vi.fn(),
          find,
          logger,
          sendEmail,
        },
      } as unknown as FirstPurchaseArgs["req"],
    } as FirstPurchaseArgs);

    expect(create).toHaveBeenCalledTimes(1);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("runs abandoned-cart and win-back campaigns from the shared runner", async () => {
    const payload = {
      create,
      find: vi.fn(
        async ({
          collection,
          page,
          where,
        }: {
          collection: string;
          page?: number;
          where?: Record<string, { equals?: string }>;
        }) => {
          if (collection === "carts") {
            return {
              docs:
                page === 1
                  ? [
                      {
                        id: 1,
                        customerEmail: "cart@example.com",
                        items: [{ product: 1, quantity: 1 }],
                        marketingOptIn: true,
                        updatedAt: "2026-03-08T00:00:00.000Z",
                      },
                    ]
                  : [],
              hasNextPage: false,
            };
          }

          if (collection === "orders") {
            return {
              docs:
                page === 1
                  ? [
                      {
                        id: 11,
                        createdAt: "2026-01-01T00:00:00.000Z",
                        customerEmail: "lapsed@example.com",
                        status: "completed",
                        contact: {
                          email: "lapsed@example.com",
                          marketingOptIn: true,
                        },
                      },
                      {
                        id: 10,
                        createdAt: "2025-12-01T00:00:00.000Z",
                        customerEmail: "lapsed@example.com",
                        status: "completed",
                        contact: {
                          email: "lapsed@example.com",
                          marketingOptIn: true,
                        },
                      },
                    ]
                  : [],
              hasNextPage: false,
            };
          }

          if (collection === "marketing-email-events") {
            return {
              docs: [],
              totalDocs: where?.dedupeKey?.equals ? 0 : 0,
            };
          }

          return {
            docs: [],
            hasNextPage: false,
            totalDocs: 0,
          };
        },
      ),
      sendEmail,
    };

    const result = await runLifecycleCampaigns({
      now: new Date("2026-03-09T00:00:00.000Z"),
      payload: payload as unknown as MockPayload,
    });

    expect(result).toEqual({
      abandonedCartEmailsSent: 1,
      skipped: 0,
      winBackEmailsSent: 1,
    });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("skips sending a lifecycle campaign when reserving the dedupe key hits a duplicate", async () => {
    const payload = {
      create: vi
        .fn()
        .mockRejectedValueOnce(new Error("SQLITE_CONSTRAINT_UNIQUE: duplicate dedupe key"))
        .mockResolvedValueOnce({ id: 2 }),
      find: vi.fn(async ({ collection, page }: { collection: string; page?: number }) => {
        if (collection === "carts") {
          return {
            docs:
              page === 1
                ? [
                    {
                      id: 1,
                      customerEmail: "cart@example.com",
                      items: [{ product: 1, quantity: 1 }],
                      marketingOptIn: true,
                      updatedAt: "2026-03-08T00:00:00.000Z",
                    },
                  ]
                : [],
            hasNextPage: false,
          };
        }

        if (collection === "orders") {
          return {
            docs: [],
            hasNextPage: false,
          };
        }

        return {
          docs: [],
          hasNextPage: false,
          totalDocs: 0,
        };
      }),
      sendEmail,
    };

    const result = await runLifecycleCampaigns({
      now: new Date("2026-03-09T00:00:00.000Z"),
      payload: payload as unknown as MockPayload,
    });

    expect(result).toEqual({
      abandonedCartEmailsSent: 0,
      skipped: 1,
      winBackEmailsSent: 0,
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(payload.create).toHaveBeenCalledTimes(1);
  });

  it("sends quote expiry, invoice due, and invoice overdue reminders from the shared runner", async () => {
    const payload = {
      create,
      find: vi.fn(async ({ collection, page }: { collection: string; page?: number }) => {
        if (collection === "crm-quotes") {
          return {
            docs:
              page === 1
                ? [
                    {
                      id: 31,
                      quoteNumber: "Q-31",
                      status: "sent",
                      expiresAt: "2026-03-11T00:00:00.000Z",
                      contact: {
                        email: "quote@example.com",
                      },
                    },
                  ]
                : [],
            hasNextPage: false,
          };
        }

        if (collection === "crm-invoices") {
          return {
            docs:
              page === 1
                ? [
                    {
                      id: 41,
                      invoiceNumber: "INV-41",
                      status: "issued",
                      dueDate: "2026-03-11T00:00:00.000Z",
                      contact: {
                        email: "due@example.com",
                      },
                    },
                    {
                      id: 42,
                      invoiceNumber: "INV-42",
                      status: "overdue",
                      dueDate: "2026-03-07T00:00:00.000Z",
                      contact: {
                        email: "overdue@example.com",
                      },
                    },
                  ]
                : [],
            hasNextPage: false,
          };
        }

        return {
          docs: [],
          hasNextPage: false,
        };
      }),
      sendEmail,
    };

    const result = await runReminderCampaigns({
      now: new Date("2026-03-09T00:00:00.000Z"),
      payload: payload as unknown as ReminderArgs["payload"],
    });

    expect(result).toEqual({
      invoiceDueRemindersSent: 1,
      invoiceOverdueRemindersSent: 1,
      quoteExpiryRemindersSent: 1,
      skipped: 0,
    });
    expect(sendEmail).toHaveBeenCalledTimes(3);
    expect(create).toHaveBeenCalledTimes(3);
  });

  it("skips reminder sends when the dedupe key already exists at reservation time", async () => {
    const payload = {
      create: vi
        .fn()
        .mockRejectedValueOnce(new Error("SQLITE_CONSTRAINT_UNIQUE: duplicate dedupe key"))
        .mockResolvedValueOnce({ id: 2 }),
      find: vi.fn(async ({ collection, page }: { collection: string; page?: number }) => {
        if (collection === "crm-quotes") {
          return {
            docs:
              page === 1
                ? [
                    {
                      id: 31,
                      quoteNumber: "Q-31",
                      status: "sent",
                      expiresAt: "2026-03-11T00:00:00.000Z",
                      contact: {
                        email: "quote@example.com",
                      },
                    },
                  ]
                : [],
            hasNextPage: false,
          };
        }

        if (collection === "crm-invoices") {
          return {
            docs: [],
            hasNextPage: false,
          };
        }

        return {
          docs: [],
          hasNextPage: false,
        };
      }),
      sendEmail,
    };

    const result = await runReminderCampaigns({
      now: new Date("2026-03-09T00:00:00.000Z"),
      payload: payload as unknown as ReminderArgs["payload"],
    });

    expect(result).toEqual({
      invoiceDueRemindersSent: 0,
      invoiceOverdueRemindersSent: 0,
      quoteExpiryRemindersSent: 0,
      skipped: 1,
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
