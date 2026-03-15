import type { Block } from "payload";

import { baseAddonFields, pricingFields } from "./shared";

export const QuantityAddon: Block = {
  slug: "quantity",
  interfaceName: "QuantityAddonBlock",
  labels: {
    singular: "Quantity Add-on",
    plural: "Quantity Add-ons",
  },
  fields: [
    ...baseAddonFields,
    {
      name: "prefilledQuantity",
      type: "number",
    },
    {
      name: "minQuantity",
      type: "number",
    },
    {
      name: "maxQuantity",
      type: "number",
    },
    ...pricingFields,
  ],
};
