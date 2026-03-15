import type { CollectionConfig } from "payload";

import { authenticated } from "../../access/authenticated";

export const ShippingZones: CollectionConfig = {
  slug: "shipping-zones",
  admin: {
    group: "Ecommerce +",
    useAsTitle: "name",
    defaultColumns: ["name", "updatedAt"],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: "Zone name (e.g., Lagos, Rest of Nigeria, International)",
      },
    },
    {
      name: "locations",
      type: "array",
      admin: {
        description: "States or Countries covered by this shipping zone.",
      },
      fields: [
        {
          name: "country",
          type: "text",
          defaultValue: "NG",
        },
        {
          name: "state",
          type: "text",
          admin: {
            description:
              "State abbreviation or full name (e.g., LA, Lagos). Leave blank for entire country.",
          },
        },
      ],
    },
    {
      name: "methods",
      type: "blocks",
      admin: {
        description: "Shipping methods available for this zone.",
      },
      blocks: [
        {
          slug: "flatRate",
          labels: {
            singular: "Flat Rate",
            plural: "Flat Rates",
          },
          fields: [
            {
              name: "cost",
              type: "number",
              required: true,
              defaultValue: 0,
            },
            {
              name: "taxStatus",
              type: "select",
              options: [
                { label: "Taxable", value: "taxable" },
                { label: "None", value: "none" },
              ],
              defaultValue: "none",
            },
          ],
        },
        {
          slug: "freeShipping",
          labels: {
            singular: "Free Shipping",
            plural: "Free Shipping",
          },
          fields: [
            {
              name: "requires",
              type: "select",
              options: [
                { label: "No Requirement", value: "none" },
                { label: "A minimum order amount", value: "minAmount" },
              ],
              defaultValue: "none",
            },
            {
              name: "minAmount",
              type: "number",
              admin: {
                condition: (_, siblingData) => siblingData.requires === "minAmount",
              },
            },
          ],
        },
        {
          slug: "localPickup",
          labels: {
            singular: "Local Pickup",
            plural: "Local Pickups",
          },
          fields: [
            {
              name: "cost",
              type: "number",
              defaultValue: 0,
            },
            {
              name: "taxStatus",
              type: "select",
              options: [
                { label: "Taxable", value: "taxable" },
                { label: "None", value: "none" },
              ],
              defaultValue: "none",
            },
          ],
        },
      ],
    },
  ],
};
