import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";
import { sendOrderStatusEmail } from "./hooks/sendOrderStatusEmail";
import { createSubscriptionOnPayment } from "./hooks/createSubscriptionOnPayment";

export const OrdersCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    useAsTitle: "id",
  },
  hooks: {
    ...defaultCollection.hooks,
    afterChange: [
      ...(defaultCollection.hooks?.afterChange || []),
      sendOrderStatusEmail,
      createSubscriptionOnPayment,
    ],
  },
  fields: [
    ...defaultCollection.fields.map((field) => {
      // The amount field in the eCommerce plugin is nested inside a 'row' field
      if (field.type === "row" && field.fields) {
        return {
          ...field,
          fields: field.fields.map((subField) => {
            if ("name" in subField && subField.name === "amount") {
              return {
                ...subField,
                admin: {
                  ...subField.admin,
                  components: {
                    ...subField.admin?.components,
                    Cell: "@/components/crm/CurrencyCell#CurrencyCell",
                  },
                },
              };
            }
            return subField;
          }),
        };
      }

      if ("name" in field && field.name === "amount") {
        return {
          ...field,
          admin: {
            ...field.admin,
            components: {
              ...field.admin?.components,
              Cell: "@/components/crm/CurrencyCell#CurrencyCell",
            },
          },
        };
      }

      if ("name" in field && field.name === "items" && field.type === "array") {
        const addonSelectionsField = {
          name: "addonSelections",
          type: "array",
          admin: {
            description: "Add-on options selected by the customer.",
          },
          fields: [
            { name: "fieldId", type: "text", required: true },
            { name: "label", type: "text", required: true },
            { name: "value", type: "text", required: true },
            { name: "priceAdjustment", type: "number", defaultValue: 0 },
            { name: "priceAdjustmentNGN", type: "number", defaultValue: 0 },
          ],
        };
        return {
          ...field,
          fields: [...field.fields, addonSelectionsField as Required<typeof field>["fields"][0]],
        };
      }

      return field;
    }),
    {
      name: "contact",
      type: "group",
      admin: {
        description: "Contact details captured during checkout.",
        position: "sidebar",
      },
      fields: [
        {
          name: "email",
          type: "email",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "firstName",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "lastName",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "phone",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "marketingOptIn",
          type: "checkbox",
          defaultValue: false,
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: "accountInvite",
      type: "group",
      admin: {
        description:
          "Invite details for shoppers who convert their guest checkout into an account.",
        position: "sidebar",
      },
      fields: [
        {
          name: "token",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "expiresAt",
          type: "date",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "redeemedAt",
          type: "date",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "user",
          type: "relationship",
          relationTo: "users",
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: "accessToken",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
      index: true,
      hooks: {
        beforeValidate: [
          ({ operation, value }: { operation: string; value: unknown }) => {
            if (operation === "create" || !value) {
              return crypto.randomUUID();
            }
            return value;
          },
        ],
      },
      unique: true,
    },
    {
      name: "shippingMethod",
      type: "text",
      admin: {
        description: "Selected shipping method (if any).",
      },
    },
    {
      name: "shippingTotal",
      type: "number",
      admin: {
        description: "Calculated shipping total.",
      },
    },
    {
      name: "taxTotal",
      type: "number",
      admin: {
        description: "Calculated tax total.",
      },
    },
  ] as any[],
});
