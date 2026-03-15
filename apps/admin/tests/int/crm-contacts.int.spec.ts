import { beforeEach, describe, expect, it, vi } from "vitest";

import { deriveLifecycleStage, recalculateCRMContactStats } from "@/plugins/crm/crm";
import { syncUserCRMContactAfterChange } from "@/plugins/crm/hooks";

type RecalculateArgs = Parameters<typeof recalculateCRMContactStats>[0];
type SyncUserArgs = Parameters<typeof syncUserCRMContactAfterChange>[0];

describe("crm contacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives a lapsed lifecycle stage from an old order date", () => {
    expect(
      deriveLifecycleStage({
        lastCartAt: null,
        lastOrderAt: "2025-01-01T00:00:00.000Z",
        totalOrders: 1,
        totalSpend: 5000,
      }),
    ).toBe("lapsed");
  });

  it("derives a vip lifecycle stage from repeat high-value orders", () => {
    expect(
      deriveLifecycleStage({
        lastCartAt: null,
        lastOrderAt: new Date().toISOString(),
        totalOrders: 5,
        totalSpend: 300000,
      }),
    ).toBe("vip");
  });

  it("recalculates crm totals from linked orders", async () => {
    const update = vi.fn().mockResolvedValue({ id: 41 });
    const find = vi.fn().mockResolvedValue({
      docs: [
        {
          amount: 10000,
          createdAt: "2026-01-01T00:00:00.000Z",
          customerEmail: "buyer@example.com",
          status: "processing",
        },
        {
          amount: 25000,
          createdAt: "2026-02-01T00:00:00.000Z",
          customerEmail: "buyer@example.com",
          status: "completed",
        },
      ],
    });
    const findByID = vi.fn().mockResolvedValue({
      id: 41,
      lastCartAt: "2026-02-15T00:00:00.000Z",
    });

    await recalculateCRMContactStats({
      contactID: 41,
      email: "buyer@example.com",
      payload: {
        find,
        findByID,
        update,
      } as unknown as RecalculateArgs["payload"],
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-contacts",
        id: 41,
        data: expect.objectContaining({
          totalOrders: 2,
          totalSpend: 35000,
          lifecycleStage: "lapsed",
        }),
      }),
    );
  });

  it("recalculates crm totals across paginated order results", async () => {
    const update = vi.fn().mockResolvedValue({ id: 41 });
    const find = vi.fn(async ({ page }: { page?: number }) => {
      if (page === 2) {
        return {
          docs: [
            {
              amount: 5000,
              createdAt: "2026-07-20T00:00:00.000Z",
              customerEmail: "buyer@example.com",
              status: "completed",
            },
            {
              amount: 9999,
              createdAt: "2026-07-21T00:00:00.000Z",
              customerEmail: "buyer@example.com",
              status: "cancelled",
            },
          ],
          hasNextPage: false,
        };
      }

      return {
        docs: Array.from({ length: 200 }, (_, index) => ({
          amount: 100,
          createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
          customerEmail: "buyer@example.com",
          status: "completed",
        })),
        hasNextPage: true,
      };
    });
    const findByID = vi.fn().mockResolvedValue({
      id: 41,
      lastCartAt: "2026-02-15T00:00:00.000Z",
    });

    await recalculateCRMContactStats({
      contactID: 41,
      email: "buyer@example.com",
      payload: {
        find,
        findByID,
        update,
      } as unknown as RecalculateArgs["payload"],
    });

    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: "orders",
        limit: 100,
        page: 1,
      }),
    );
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: "orders",
        limit: 100,
        page: 2,
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-contacts",
        id: 41,
        data: expect.objectContaining({
          firstOrderAt: "2026-01-01T00:00:00.000Z",
          lastOrderAt: "2026-07-20T00:00:00.000Z",
          totalOrders: 201,
          totalSpend: 25000,
        }),
      }),
    );
  });

  it("syncs a user into crm contacts after account changes", async () => {
    const create = vi.fn().mockResolvedValue({ id: 77 });
    const update = vi.fn();
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 });
    const payload = {
      create,
      find,
      logger: { warn: vi.fn() },
      update,
    };

    await syncUserCRMContactAfterChange({
      doc: {
        crmContact: null,
        email: "owner@example.com",
        id: 9,
        marketingOptIn: true,
        name: "Owner Name",
      } as SyncUserArgs["doc"],
      req: {
        payload,
      } as unknown as SyncUserArgs["req"],
    } as SyncUserArgs);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-contacts",
        data: expect.objectContaining({
          email: "owner@example.com",
          marketingOptIn: true,
          user: 9,
        }),
      }),
    );
  });
});
