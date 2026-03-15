import { ecommerceApiConfig } from "@/providers/ecommerceApiConfig";
import { describe, expect, it } from "vitest";

describe("ecommerce provider cart populate config", () => {
  it("includes product and variant pricing fields required for checkout and payment initiation", () => {
    expect(ecommerceApiConfig).toMatchObject({
      cartsFetchQuery: {
        depth: 2,
        populate: {
          products: {
            priceInUSD: true,
            priceInNGN: true,
            subscriptionPrice: true,
            subscriptionPriceNGN: true,
            isSubscription: true,
          },
          variants: {
            priceInUSD: true,
            priceInNGN: true,
            options: true,
          },
        },
      },
    });
  });
});
