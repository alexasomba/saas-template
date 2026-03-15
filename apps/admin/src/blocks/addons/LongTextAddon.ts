import type { Block } from "payload";

import { baseAddonFields, pricingFields } from "./shared";

export const LongTextAddon: Block = {
  slug: "longText",
  interfaceName: "LongTextAddonBlock",
  labels: {
    singular: "Long Text Add-on",
    plural: "Long Text Add-ons",
  },
  fields: [
    ...baseAddonFields,
    {
      name: "placeholder",
      type: "text",
    },
    {
      name: "maxLength",
      type: "number",
    },
    ...pricingFields,
  ],
};
