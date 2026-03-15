import { CallToAction } from "@/blocks/CallToAction/config";
import { Content } from "@/blocks/Content/config";
import { MediaBlock } from "@/blocks/MediaBlock/config";
import { slugField } from "payload";
import { generatePreviewPath } from "@/utilities/generatePreviewPath";
import { syncSubscriptionCommercePrices } from "@/utilities/ecommerce/syncSubscriptionCommercePrices";
import { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields";
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { DefaultDocumentIDType, Where } from "payload";
import { slugifyTextOrUndefined } from "@/utilities/slugify";
import { allAddonBlocks } from "@/blocks/addons";

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection?.hooks,
    beforeChange: [
      ...(defaultCollection?.hooks?.beforeChange ?? []),
      ({ data }) => {
        if (!data || typeof data !== "object") {
          return data;
        }

        return syncSubscriptionCommercePrices(data as Record<string, unknown>);
      },
    ],
    beforeValidate: [
      ...(defaultCollection?.hooks?.beforeValidate ?? []),
      ({ data }) => {
        if (!data || typeof data !== "object") {
          return data;
        }

        return syncSubscriptionCommercePrices(data as Record<string, unknown>);
      },
    ],
  },
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: ["title", "productType", "enableVariants", "_status"],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: "products",
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: "products",
        req,
      }),
    useAsTitle: "title",
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    priceInUSD: true,
    priceInNGN: true,
    subscriptionPrice: true,
    subscriptionPriceNGN: true,
    period: true,
    interval: true,
    inventory: true,
    meta: true,
    productType: true,
    isVirtual: true,
    isDownloadable: true,
    isSubscription: true,
    addons: true,
    externalUrl: true,
    externalButtonText: true,
    groupedProducts: true,
    sku: true,
    taxStatus: true,
    taxClass: true,
    shippingClass: true,
    weight: true,
    length: true,
    width: true,
    height: true,
  },
  fields: [
    { name: "title", type: "text", required: true },

    // ── Sidebar: Product Type discriminator ────────────────────────────────
    {
      name: "productType",
      type: "select",
      defaultValue: "simple",
      required: true,
      options: [
        { label: "Simple (Physical)", value: "simple" },
        { label: "Variable (Size / Color)", value: "variable" },
        { label: "Grouped (Collection)", value: "grouped" },
        { label: "External / Affiliate", value: "external" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Select the product type. Variable products use the variant system. Grouped and External types unlock additional fields.",
      },
    },

    // ── Sidebar: Virtual & Downloadable modifiers ──────────────────────────
    {
      name: "isVirtual",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "No shipping required (e.g. services, memberships). Checkout skips the shipping step when all cart items are virtual.",
        condition: (data) => data?.productType === "simple" || data?.productType === "variable",
      },
    },
    {
      name: "isDownloadable",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Customer receives download links after purchase.",
        condition: (data) => data?.productType === "simple" || data?.productType === "variable",
      },
    },
    {
      name: "isSubscription",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Product represents a recurring subscription.",
        condition: (data) => data?.productType === "simple" || data?.productType === "variable",
      },
    },

    // ── Main content tabs ──────────────────────────────────────────────────
    {
      type: "tabs",
      tabs: [
        // ── Tab: Content ─────────────────────────────────────────────────
        {
          fields: [
            {
              name: "description",
              type: "richText",
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ];
                },
              }),
              label: false,
              required: false,
            },
            {
              name: "gallery",
              type: "array",
              minRows: 1,
              fields: [
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                },
                {
                  name: "variantOption",
                  type: "relationship",
                  relationTo: "variantOptions",
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0;
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map(
                        (item: DefaultDocumentIDType | { id: DefaultDocumentIDType }) => {
                          if (typeof item === "object" && item !== null && "id" in item) {
                            return item.id as DefaultDocumentIDType;
                          }

                          return item as DefaultDocumentIDType;
                        },
                      );

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        };

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      };

                      return query;
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    };
                  },
                },
              ],
            },

            {
              name: "layout",
              type: "blocks",
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: "Content",
        },

        // ── Tab: Product Details (pricing, variants, related) ─────────────
        {
          fields: [
            ...defaultCollection.fields,
            {
              name: "relatedProducts",
              type: "relationship",
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  };
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                };
              },
              hasMany: true,
              relationTo: "products",
            },
          ],
          label: "Product Details",
        },

        // ── Tab: Grouped Products ─────────────────────────────────────────
        {
          label: "Grouped Products",
          fields: [
            {
              name: "groupedProducts",
              type: "relationship",
              relationTo: "products",
              hasMany: true,
              label: "Child Products",
              admin: {
                description:
                  "Select the individual products to display on this grouped product page.",
                condition: (data) => data?.productType === "grouped",
              },
              filterOptions: ({ id }) => {
                const filter: Where = {
                  productType: { not_equals: "grouped" },
                };
                if (id) {
                  return {
                    and: [filter, { id: { not_equals: id } }],
                  };
                }
                return filter;
              },
            },
          ],
        },

        // ── Tab: External / Affiliate ─────────────────────────────────────
        {
          label: "External Product",
          fields: [
            {
              name: "externalUrl",
              label: "Product URL",
              type: "text",
              admin: {
                description: "Full URL to the product on the external website.",
                condition: (data) => data?.productType === "external",
              },
              validate: (
                value: string | null | undefined,
                { data }: { data: Record<string, unknown> },
              ) => {
                if ((data as { productType?: string })?.productType !== "external") return true;
                if (!value) return "An external URL is required for External/Affiliate products.";
                return true;
              },
            },
            {
              name: "externalButtonText",
              label: "Button Label",
              type: "text",
              defaultValue: "Buy Now",
              admin: {
                description: 'Text shown on the link-out button (default: "Buy Now").',
                condition: (data) => data?.productType === "external",
              },
            },
          ],
        },

        // ── Tab: Downloads ────────────────────────────────────────────────
        {
          label: "Downloads",
          fields: [
            {
              name: "downloadableFiles",
              type: "array",
              label: "Downloadable Files",
              labels: { singular: "File", plural: "Files" },
              minRows: 1,
              fields: [
                {
                  name: "name",
                  type: "text",
                  required: true,
                  label: "File Name",
                  admin: { placeholder: "e.g. User Manual PDF" },
                },
                {
                  name: "file",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                },
              ],
              admin: {
                condition: (data) => data?.isDownloadable === true,
                description: "Files the customer can download after purchase.",
              },
            },
            {
              name: "downloadLimit",
              type: "number",
              label: "Download Limit",
              defaultValue: -1,
              admin: {
                description: "Maximum downloads per order item. -1 = unlimited.",
                step: 1,
                condition: (data) => data?.isDownloadable === true,
              },
            },
            {
              name: "downloadExpiry",
              type: "number",
              label: "Download Expiry (days)",
              defaultValue: -1,
              admin: {
                description: "Days before download link expires after purchase. -1 = never.",
                step: 1,
                condition: (data) => data?.isDownloadable === true,
              },
            },
          ],
        },

        // ── Tab: Add-ons ──────────────────────────────────────────────────
        {
          label: "Add-ons",
          fields: [
            {
              name: "excludeGlobalAddons",
              type: "checkbox",
              defaultValue: false,
              label: "Exclude Global Add-ons",
              admin: {
                description: "If checked, global add-on groups will not apply to this product.",
              },
            },
            {
              name: "addons",
              type: "blocks",
              label: "Per-Product Add-ons",
              blocks: allAddonBlocks,
            },
          ],
        },

        // ── Tab: Subscription ─────────────────────────────────────────────
        {
          label: "Subscription",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "subscriptionPrice",
                  label: "Subscription Price (USD)",
                  type: "number",
                  admin: {
                    description: "Recurring price in USD (cents).",
                  },
                },
                {
                  name: "subscriptionPriceNGN",
                  label: "Subscription Price (NGN)",
                  type: "number",
                  admin: {
                    description: "Recurring price in NGN (kobo).",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "period",
                  type: "select",
                  defaultValue: "month",
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
                  defaultValue: 1,
                  min: 1,
                  admin: {
                    description: "e.g. interval=1 period=month means every month.",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "trialDays",
                  type: "number",
                  defaultValue: 0,
                  min: 0,
                  admin: {
                    description: "Free trial length in days. 0 = no trial.",
                  },
                },
                {
                  name: "expiryLength",
                  type: "number",
                  defaultValue: 0,
                  min: 0,
                  admin: {
                    description: "Number of periods until subscription expires. 0 = never expires.",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "signUpFee",
                  label: "Sign-up Fee (USD)",
                  type: "number",
                  defaultValue: 0,
                  min: 0,
                  admin: {
                    description: "Upfront sign-up fee in USD (cents).",
                  },
                },
                {
                  name: "signUpFeeNGN",
                  label: "Sign-up Fee (NGN)",
                  type: "number",
                  defaultValue: 0,
                  min: 0,
                  admin: {
                    description: "Upfront sign-up fee in NGN (kobo).",
                  },
                },
              ],
            },
          ],
          admin: {
            condition: (data) => data?.isSubscription === true,
          },
        },

        // ── Tab: SEO ──────────────────────────────────────────────────────
        {
          label: "Tax & Shipping",
          fields: [
            {
              name: "sku",
              label: "SKU",
              type: "text",
              admin: {
                description: "Stock-keeping unit identifier.",
                condition: (data) =>
                  !data?.isVirtual &&
                  (data?.productType === "simple" || data?.productType === "variable"),
              },
            },
            {
              name: "taxStatus",
              type: "select",
              options: [
                { label: "Taxable", value: "taxable" },
                { label: "Shipping Only", value: "shipping" },
                { label: "None", value: "none" },
              ],
              defaultValue: "taxable",
              admin: {
                description: "Determine if this product is taxable.",
              },
            },
            {
              name: "taxClass",
              type: "relationship",
              relationTo: "tax-classes",
              admin: {
                condition: (data) => data.taxStatus === "taxable" || data.taxStatus === "shipping",
              },
            },
            {
              name: "shippingClass",
              type: "relationship",
              relationTo: "shipping-classes",
              admin: {
                condition: (data) =>
                  !data?.isVirtual &&
                  (data?.productType === "simple" || data?.productType === "variable"),
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "weight",
                  type: "number",
                  admin: {
                    description: "Weight in kg",
                    step: 0.001,
                    condition: (data) =>
                      !data?.isVirtual &&
                      (data?.productType === "simple" || data?.productType === "variable"),
                  },
                },
                {
                  name: "length",
                  type: "number",
                  admin: {
                    description: "Length in cm",
                    step: 0.1,
                    condition: (data) =>
                      !data?.isVirtual &&
                      (data?.productType === "simple" || data?.productType === "variable"),
                  },
                },
                {
                  name: "width",
                  type: "number",
                  admin: {
                    description: "Width in cm",
                    step: 0.1,
                    condition: (data) =>
                      !data?.isVirtual &&
                      (data?.productType === "simple" || data?.productType === "variable"),
                  },
                },
                {
                  name: "height",
                  type: "number",
                  admin: {
                    description: "Height in cm",
                    step: 0.1,
                    condition: (data) =>
                      !data?.isVirtual &&
                      (data?.productType === "simple" || data?.productType === "variable"),
                  },
                },
              ],
            },
          ],
        },
        {
          name: "meta",
          label: "SEO",
          fields: [
            OverviewField({
              titlePath: "meta.title",
              descriptionPath: "meta.description",
              imagePath: "meta.image",
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: "media",
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: "meta.title",
              descriptionPath: "meta.description",
            }),
          ],
        },
      ],
    },
    {
      name: "categories",
      type: "relationship",
      admin: {
        position: "sidebar",
        sortOptions: "title",
      },
      hasMany: true,
      relationTo: "categories",
    },
    slugField({
      slugify: ({ valueToSlugify }) => slugifyTextOrUndefined(valueToSlugify),
    }),
  ],
});
