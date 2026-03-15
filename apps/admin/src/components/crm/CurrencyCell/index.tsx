"use client";

import { currenciesConfig, DEFAULT_CURRENCY } from "@/config/currencies";

export const CurrencyCell: React.FC<{ cellData: any }> = ({ cellData }) => {
  if (typeof cellData !== "number") {
    return <span>{cellData ?? "-"}</span>;
  }

  const currencyInfo = currenciesConfig.supportedCurrencies?.find(
    (c) => c.code === DEFAULT_CURRENCY,
  );
  const decimals = currencyInfo?.decimals ?? 2;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).format(cellData / Math.pow(10, decimals));

  return <span>{formatted}</span>;
};
