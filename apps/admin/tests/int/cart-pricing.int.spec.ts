import { beforeEach, describe, expect, it, vi } from "vitest";

import { CartsCollection } from "@/collections/Carts";

describe("cart subscription pricing", () => {
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

  it("uses subscription pricing when recalculating subtotal", async () => {
    expect(recalculateSubtotal).toBeDefined();

    const result = await recalculateSubtotal?.({
      data: {
        currency: "NGN",
      },
      originalDoc: {
        currency: "NGN",
        items: [
          {
            product: {
              id: 11,
              isSubscription: true,
              priceInNGN: 0,
              subscriptionPriceNGN: 750000,
            },
            quantity: 2,
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
      currency: "NGN",
      subtotal: 1500000,
    });
  });
});
