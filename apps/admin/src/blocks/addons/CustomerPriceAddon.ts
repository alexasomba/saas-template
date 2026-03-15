import type { Block } from "payload";

import { baseAddonFields } from "./shared";

export const CustomerPriceAddon: Block = {
  slug: "customerPrice",
  interfaceName: "CustomerPriceAddonBlock",
  labels: {
    singular: "Customer Defined Price Add-on",
    plural: "Customer Defined Price Add-ons",
  },
  fields: [
    ...baseAddonFields,
    {
      name: "prefilledPrice",
      type: "number",
    },
    {
      name: "minPrice",
      type: "number",
    },
    {
      name: "maxPrice",
      type: "number",
    },
  ],
};
