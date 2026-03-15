import type { CountryType } from "@payloadcms/plugin-ecommerce/types";
import { defaultCountries } from "@payloadcms/plugin-ecommerce/client/react";

const nigeria: CountryType = {
  label: "Nigeria",
  value: "NG",
};

export const supportedCountries: CountryType[] = defaultCountries.some(
  (country) => country.value === nigeria.value,
)
  ? defaultCountries
  : [...defaultCountries, nigeria];
