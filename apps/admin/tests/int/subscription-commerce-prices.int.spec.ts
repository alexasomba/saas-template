import { syncSubscriptionCommercePrices } from "@/utilities/ecommerce/syncSubscriptionCommercePrices";
import { describe, expect, it } from "vitest";

describe("syncSubscriptionCommercePrices", () => {
  it("mirrors subscription prices into base commerce prices for subscription products", () => {
    expect(
      syncSubscriptionCommercePrices({
        isSubscription: true,
        subscriptionPrice: 4900,
        subscriptionPriceNGN: 750000,
      }),
    ).toMatchObject({
      priceInUSD: 4900,
      priceInNGN: 750000,
    });
  });

  it("does not overwrite non-subscription products", () => {
    expect(
      syncSubscriptionCommercePrices({
        isSubscription: false,
        priceInUSD: 2500,
        priceInNGN: 400000,
        subscriptionPrice: 4900,
        subscriptionPriceNGN: 750000,
      }),
    ).toMatchObject({
      priceInUSD: 2500,
      priceInNGN: 400000,
    });
  });
});
