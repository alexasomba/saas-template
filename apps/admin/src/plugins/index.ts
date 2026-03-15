import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { searchPlugin } from "@payloadcms/plugin-search";
import { Plugin } from "payload";
import { GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types";
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { ecommercePlugin } from "@payloadcms/plugin-ecommerce";
import { importExportPlugin } from "@payloadcms/plugin-import-export";

import { paystackAdapter } from "./paystack";
import { crmPlugin } from "./crm";
import { cartsConfig, ordersConfig } from "./ecommerceConfig";
import { importExportCollections, importExportLimits } from "./importExportConfig";

import { Page, Post, Product } from "@/payload-types";
import { getServerSideURL } from "@/utilities/getURL";
import { ProductsCollection } from "@/collections/Products";
import { adminOrCustomerOwner } from "@/access/adminOrCustomerOwner";
import { adminOrPublishedStatus } from "@/access/adminOrPublishedStatus";
import { adminOnly } from "@/access/adminOnly";
import { adminOnlyFieldAccess } from "@/access/adminOnlyFieldAccess";
import { publicAccess } from "@/access/publicAccess";
import { customerOnlyFieldAccess } from "@/access/customerOnlyFieldAccess";
import { revalidateRedirects } from "@/hooks/revalidateRedirects";
import { searchFields } from "@/search/fieldOverrides";
import { beforeSyncWithSearch } from "@/search/beforeSync";
import { currenciesConfig } from "@/config/currencies";
import { supportedCountries } from "@/config/supportedCountries";

const generateTitle: GenerateTitle<Product | Page | Post> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Template` : "Payload Template";
};

const generateURL: GenerateURL<Product | Page | Post> = ({ doc }) => {
  const url = getServerSideURL();

  return doc?.slug ? `${url}/${doc.slug}` : url;
};

const requireEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const paystackSecretKey = requireEnv("PAYSTACK_SECRET_KEY");
const paystackPublicKey = requireEnv("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY");

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ["pages", "posts"],
    overrides: {
      // @ts-expect-error - mapped field overrides widen admin configuration
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ("name" in field && field.name === "from") {
            const existingAdmin =
              "admin" in field ? (field as { admin?: Record<string, unknown> }).admin : undefined;
            return {
              ...field,
              admin: {
                ...existingAdmin,
                description: "Rebuild the site after changing this redirect.",
              },
            };
          }
          return field;
        });
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ["categories"],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ""),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      admin: {
        group: "Content",
      },
    },
    formOverrides: {
      admin: {
        group: "Content",
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ("name" in field && field.name === "confirmationMessage") {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }),
                  ];
                },
              }),
            };
          }
          return field;
        });
      },
    },
  }),
  searchPlugin({
    collections: ["posts"],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields];
      },
    },
  }),
  ecommercePlugin({
    access: {
      isAdmin: adminOnly,
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isDocumentOwner: adminOrCustomerOwner,
      publicAccess,
    },
    currencies: currenciesConfig,
    addresses: {
      supportedCountries,
    },
    customers: {
      slug: "users",
    },
    payments: {
      paymentMethods: [
        paystackAdapter({
          secretKey: paystackSecretKey,
          publicKey: paystackPublicKey,
        }),
      ],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
    },
    carts: cartsConfig,
    orders: ordersConfig,
  }),
  crmPlugin(),
  importExportPlugin({
    ...importExportLimits,
    collections: [...importExportCollections],
  }),
];
