import { describe, expect, it } from "vitest";

import { buildCRMSegmentWhere } from "@/plugins/crm/crm";

describe("crm segments", () => {
  it("builds a saved contact segment from lifecycle, consent, spend, and tags", () => {
    const where = buildCRMSegmentWhere({
      lastOrderBeforeDays: 30,
      lifecycleStages: [{ value: "lapsed" }, { value: "vip" }],
      marketingOptInOnly: true,
      minimumTotalOrders: 2,
      minimumTotalSpend: 50000,
      tags: [{ tag: "wholesale" }],
    });

    expect(where).toEqual(
      expect.objectContaining({
        and: expect.arrayContaining([
          { marketingOptIn: { equals: true } },
          { totalOrders: { greater_than_equal: 2 } },
          { totalSpend: { greater_than_equal: 50000 } },
          { lifecycleStage: { in: ["lapsed", "vip"] } },
          { "tags.tag": { equals: "wholesale" } },
        ]),
      }),
    );
  });

  it("returns an empty filter for an unconstrained segment", () => {
    expect(buildCRMSegmentWhere({})).toEqual({});
  });
});
