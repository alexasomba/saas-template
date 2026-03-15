import type { CollectionConfig } from "payload";

import { adminOnly } from "@/access/adminOnly";
import { adminOrCustomerOwner } from "@/access/adminOrCustomerOwner";
import { adminOnlyFieldAccess } from "@/access/adminOnlyFieldAccess";

export const Subscriptions: CollectionConfig = {
  slug: "subscriptions",
  labels: {
    singular: "Subscription",
    plural: "Subscriptions",
  },
  admin: {
    group: "Ecommerce +",
    useAsTitle: "id",
    defaultColumns: ["id", "customer", "status", "nextPaymentDate"],
  },
  access: {
    read: adminOrCustomerOwner,
    create: () => false, // Only system creates them (via Order hook)
    update: adminOrCustomerOwner,
    delete: adminOnly,
  },
  fields: [
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "On Hold (Payment Failed)", value: "on-hold" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Expired", value: "expired" },
      ],
    },
    {
      name: "customer",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
    },
    {
      name: "variant",
      type: "relationship",
      relationTo: "variants",
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
      required: true,
      admin: {
        description: "The initial order containing the checkout details and authorization.",
      },
    },
    {
      name: "period",
      type: "select",
      required: true,
      options: [
        { label: "Day", value: "day" },
        { label: "Week", value: "week" },
        { label: "Month", value: "month" },
        { label: "Year", value: "year" },
      ],
    },
    {
      name: "interval",
      type: "number",
      required: true,
      min: 1,
    },
    {
      name: "nextPaymentDate",
      type: "date",
      admin: {
        description: "The date and time the next renewal charge will be attempted.",
      },
    },
    {
      name: "endDate",
      type: "date",
      admin: {
        description: "The date the subscription naturally expires (if applicable).",
      },
    },
    {
      name: "trialEndDate",
      type: "date",
    },
    {
      name: "subscriptionPrice",
      type: "number",
      required: true,
    },
    {
      name: "subscriptionPriceNGN",
      type: "number",
      required: true,
    },
    {
      name: "currency",
      type: "select",
      required: true,
      options: [
        { label: "USD", value: "USD" },
        { label: "NGN", value: "NGN" },
      ],
    },
    {
      name: "paystackAuthCode",
      type: "text",
      access: {
        read: adminOnlyFieldAccess,
      },
      admin: {
        description: "Stored authorization code for recurring charges.",
        readOnly: true,
      },
    },
    {
      name: "paystackCustomerCode",
      type: "text",
      access: {
        read: adminOnlyFieldAccess,
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: "paystackEmail",
      type: "text",
      access: {
        read: adminOnlyFieldAccess,
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: "failedPaymentCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "lastFailedAt",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "renewalOrders",
      type: "relationship",
      relationTo: "orders",
      hasMany: true,
    },
  ],
};
