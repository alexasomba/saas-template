import { beforeEach, describe, expect, it, vi } from "vitest";

import { CartsCollection } from "@/collections/Carts";

describe("cart subtotal recalculation", () => {
  const collection = CartsCollection({
    defaultCollection: {
      fields: [],
      hooks: {
        beforeChange: [],
      },
    },
  } as never) as Awaited<ReturnType<typeof CartsCollection>>;

  const recalculateSubtotal = collection.hooks?.beforeChange?.at(-1);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recalculates subtotal from existing items when only currency changes", async () => {
    expect(recalculateSubtotal).toBeDefined();

    const result = await recalculateSubtotal?.({
      data: {
        currency: "USD",
      },
      originalDoc: {
        currency: "NGN",
        items: [
          {
            product: {
              id: 10,
              priceInUSD: 2500,
              priceInNGN: 400000,
            },
            quantity: 3,
          },
        ],
      },
      req: {
        payload: {
          findByID: vi.fn(),
        },
      },
    } as never);

    expect(result).toMatchObject({
      currency: "USD",
      subtotal: 7500,
    });
  });
});
