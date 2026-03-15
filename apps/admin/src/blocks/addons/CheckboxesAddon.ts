import type { Block } from "payload";

import { baseAddonFields, pricingFields } from "./shared";

export const CheckboxesAddon: Block = {
  slug: "checkboxes",
  interfaceName: "CheckboxesAddonBlock",
  labels: {
    singular: "Checkboxes Add-on",
    plural: "Checkboxes Add-ons",
  },
  fields: [
    ...baseAddonFields,
    {
      name: "options",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        ...pricingFields,
        {
          name: "defaultChecked",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "hidden",
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
  ],
};
