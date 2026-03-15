import type { Block } from "payload";

import { baseAddonFields, pricingFields } from "./shared";

export const DatePickerAddon: Block = {
  slug: "datePicker",
  interfaceName: "DatePickerAddonBlock",
  labels: {
    singular: "Date Picker Add-on",
    plural: "Date Picker Add-ons",
  },
  fields: [...baseAddonFields, ...pricingFields],
};
