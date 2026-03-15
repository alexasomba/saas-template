import type { Block } from "payload";

import { baseAddonFields, pricingFields } from "./shared";

export const MultipleChoiceAddon: Block = {
  slug: "multipleChoice",
  interfaceName: "MultipleChoiceAddonBlock",
  labels: {
    singular: "Multiple Choice Add-on",
    plural: "Multiple Choice Add-ons",
  },
  fields: [
    ...baseAddonFields,
    {
      name: "displayAs",
      type: "select",
      required: true,
      defaultValue: "dropdown",
      options: [
        { label: "Dropdown", value: "dropdown" },
        { label: "Radio Buttons", value: "radio" },
        { label: "Images", value: "images" },
      ],
    },
    {
      name: "defaultOption",
      type: "text",
      admin: {
        description: "Enter the label of the option to select by default (optional).",
      },
    },
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
          name: "hidden",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          admin: {
            condition: (_, _siblingData) => {
              // We'd ideally check if displayAs is 'images' but siblingData is inside the array row.
              // So we just show it always or let them upload if they want.
              return true;
            },
          },
        },
      ],
    },
  ],
};
