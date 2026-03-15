import type { CollectionConfig } from "payload";

import { authenticated } from "../../access/authenticated";

export const TaxClasses: CollectionConfig = {
  slug: "tax-classes",
  admin: {
    group: "Ecommerce +",
    useAsTitle: "title",
    defaultColumns: ["title", "rate", "updatedAt"],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Name of the tax class (e.g., Standard, Zero-Rated, Exempt)",
      },
    },
    {
      name: "rate",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        description: "Tax rate percentage (e.g., 7.5 for 7.5%)",
        step: 0.01,
      },
    },
  ],
};
