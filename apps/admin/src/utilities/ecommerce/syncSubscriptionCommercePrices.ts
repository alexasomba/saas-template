type ProductPricingData = {
  isSubscription?: boolean | null;
  subscriptionPrice?: number | null;
  subscriptionPriceNGN?: number | null;
  priceInUSD?: number | null;
  priceInNGN?: number | null;
};

export const syncSubscriptionCommercePrices = <T extends ProductPricingData>(data: T): T => {
  if (!data || data.isSubscription !== true) {
    return data;
  }

  return {
    ...data,
    ...(typeof data.subscriptionPrice === "number"
      ? { priceInUSD: data.subscriptionPrice }
      : { priceInUSD: null }),
    ...(typeof data.subscriptionPriceNGN === "number"
      ? { priceInNGN: data.subscriptionPriceNGN }
      : { priceInNGN: null }),
  };
};
