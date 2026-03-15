import type { CurrenciesConfig } from "@payloadcms/plugin-ecommerce/types";

export const SUPPORTED_CURRENCY_CODES = ["USD", "NGN"] as const;
export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];
export const DEFAULT_CURRENCY: SupportedCurrencyCode = "NGN";

export const currenciesConfig: CurrenciesConfig = {
  defaultCurrency: DEFAULT_CURRENCY,
  supportedCurrencies: [
    {
      code: "USD",
      decimals: 2,
      label: "USD",
      symbol: "$",
    },
    {
      code: "NGN",
      decimals: 2,
      label: "NGN",
      symbol: "₦",
    },
  ],
};
