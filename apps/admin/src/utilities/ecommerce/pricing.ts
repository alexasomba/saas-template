import type { Product, Variant } from "@/payload-types";

type CurrencyCode = "NGN" | "USD" | (string & {});
type PriceLookupDoc = Partial<Product & Variant> & Record<string, unknown>;

const readNumericField = (doc: PriceLookupDoc | null | undefined, fieldName: string) => {
  if (!doc) return null;

  const value = doc[fieldName];
  return typeof value === "number" ? value : null;
};

export const getCurrencyPriceField = (currencyCode: CurrencyCode) =>
  `priceIn${currencyCode.toUpperCase()}`;

export const getSubscriptionPriceField = (currencyCode: CurrencyCode) =>
  currencyCode.toUpperCase() === "USD" ? "subscriptionPrice" : "subscriptionPriceNGN";

export function getEffectiveUnitPrice({
  currencyCode,
  product,
  variant,
}: {
  currencyCode: CurrencyCode;
  product?: PriceLookupDoc | null;
  variant?: PriceLookupDoc | null;
}) {
  const unitPriceFromVariant = readNumericField(variant, getCurrencyPriceField(currencyCode));

  if (unitPriceFromVariant !== null) {
    return unitPriceFromVariant;
  }

  const isSubscription =
    typeof product?.isSubscription === "boolean"
      ? product.isSubscription
      : Boolean(product?.isSubscription);

  if (isSubscription) {
    const subscriptionPrice = readNumericField(product, getSubscriptionPriceField(currencyCode));

    if (subscriptionPrice !== null) {
      return subscriptionPrice;
    }
  }

  return readNumericField(product, getCurrencyPriceField(currencyCode));
}
