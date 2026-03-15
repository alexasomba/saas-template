import type { Block } from "payload";

import { baseAddonFields, pricingFields } from "./shared";

export const ShortTextAddon: Block = {
  slug: "shortText",
  interfaceName: "ShortTextAddonBlock",
  labels: {
    singular: "Short Text Add-on",
    plural: "Short Text Add-ons",
  },
  fields: [
    ...baseAddonFields,
    {
      name: "restriction",
      type: "select",
      required: true,
      defaultValue: "any",
      options: [
        { label: "Any Text", value: "any" },
        { label: "Only Letters", value: "letters" },
        { label: "Only Numbers", value: "numbers" },
        { label: "Letters and Numbers", value: "alphanumeric" },
        { label: "Email Address", value: "email" },
      ],
    },
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
