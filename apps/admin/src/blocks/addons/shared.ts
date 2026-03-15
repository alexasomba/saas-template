import type { Field } from "payload";

export const baseAddonFields: Field[] = [
  {
    name: "label",
    type: "text",
    required: true,
  },
  {
    name: "description",
    type: "textarea",
  },
  {
    name: "required",
    type: "checkbox",
    defaultValue: false,
  },
];

export const pricingFields: Field[] = [
  {
    name: "priceType",
    type: "select",
    required: true,
    defaultValue: "flat",
    options: [
      { label: "Flat Fee", value: "flat" },
      { label: "Quantity Based", value: "quantity_based" },
      { label: "Percentage", value: "percentage" },
    ],
  },
  {
    name: "price",
    type: "number",
    required: true,
    defaultValue: 0,
    admin: {
      description: "0 for free, negative for a discount.",
    },
  },
];
