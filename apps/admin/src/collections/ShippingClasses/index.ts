import type { CollectionConfig } from "payload";

import { authenticated } from "../../access/authenticated";

export const ShippingClasses: CollectionConfig = {
  slug: "shipping-classes",
  admin: {
    group: "Ecommerce +",
    useAsTitle: "title",
    defaultColumns: ["title", "updatedAt"],
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
        description: "Name of the shipping class (e.g., Heavy, Fragile, Standard)",
      },
    },
    {
      name: "description",
      type: "textarea",
    },
  ],
};
