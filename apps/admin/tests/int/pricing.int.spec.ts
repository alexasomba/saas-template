import { getEffectiveUnitPrice } from "@/utilities/ecommerce/pricing";
import { describe, expect, it } from "vitest";

describe("pricing utilities", () => {
  it("uses subscription pricing for subscription products", () => {
    expect(
      getEffectiveUnitPrice({
        currencyCode: "USD",
        product: {
          isSubscription: true,
          priceInUSD: 0,
          subscriptionPrice: 4900,
        },
      }),
    ).toBe(4900);

    expect(
      getEffectiveUnitPrice({
        currencyCode: "NGN",
        product: {
          isSubscription: true,
          priceInNGN: 0,
          subscriptionPriceNGN: 750000,
        },
      }),
    ).toBe(750000);
  });

  it("prefers variant pricing when present", () => {
    expect(
      getEffectiveUnitPrice({
        currencyCode: "USD",
        product: {
          isSubscription: true,
          subscriptionPrice: 4900,
        },
        variant: {
          priceInUSD: 2900,
        },
      }),
    ).toBe(2900);
  });
});
