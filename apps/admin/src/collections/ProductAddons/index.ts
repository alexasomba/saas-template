import type { CollectionConfig } from "payload";

import { allAddonBlocks } from "../../blocks/addons";

export const ProductAddons: CollectionConfig = {
  slug: "product-addons",
  labels: {
    singular: "Global Add-on Group",
    plural: "Global Add-on Groups",
  },
  admin: {
    group: "Ecommerce +",
    useAsTitle: "name",
    defaultColumns: ["name", "displayOrder", "updatedAt"],
  },
  access: {
    read: () => true, // Publicly readable for the storefront
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: "Internal name for this add-on group (not shown to customers).",
      },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        description: "Leave empty to apply to all products, or select specific categories.",
      },
    },
    {
      name: "displayOrder",
      type: "number",
      defaultValue: 10,
      admin: {
        description: "Lower numbers are displayed higher on the product page.",
      },
    },
    {
      name: "excludeFromProducts",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      admin: {
        description: "Explicitly exclude specific products from this global add-on group.",
      },
    },
    {
      name: "fields",
      type: "blocks",
      required: true,
      minRows: 1,
      blocks: allAddonBlocks,
    },
  ],
};
