import type { Product } from "@/payload-types";

export const productSubscription: Partial<Product> = {
  title: "Newsletter Pro Monthly",
  slug: "newsletter-pro-monthly",
  productType: "simple",
  isVirtual: true, // Services/subscriptions are often virtual
  isSubscription: true,
  period: "month",
  interval: 1,
  trialDays: 7,
  subscriptionPrice: 2500, // $25.00
  subscriptionPriceNGN: 2500000, // ₦25,000.00
  priceInUSD: 2500,
  priceInNGN: 2500000,
  enableVariants: false,
  inventory: 9999,
  priceInUSDEnabled: true,
  priceInNGNEnabled: true,
  meta: {
    title: "Newsletter Pro Monthly",
    description: "Get access to our premium weekly newsletter.",
  },
  _status: "published",
};
