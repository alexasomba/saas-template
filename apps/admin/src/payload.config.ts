import { CloudflareContext, getCloudflareContext } from "@opennextjs/cloudflare";
import { sqliteD1Adapter } from "@payloadcms/db-d1-sqlite";
import { r2Storage } from "@payloadcms/storage-r2";

import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import type { Config } from "payload";
// import sharp from 'sharp' // Disabled because sharp native module is not supported on Cloudflare Workers
import { fileURLToPath } from "url";
import { GetPlatformProxyOptions } from "wrangler";

import { Categories } from "@/collections/Categories";
import { Media } from "@/collections/Media";
import { Pages } from "@/collections/Pages";
import { Posts } from "@/collections/Posts";
import { ProductAddons } from "@/collections/ProductAddons";
import { ShippingClasses } from "@/collections/ShippingClasses";
import { ShippingZones } from "@/collections/ShippingZones";
import { Subscriptions } from "@/collections/Subscriptions";
import { TaxClasses } from "@/collections/TaxClasses";
import { Users } from "@/collections/Users";
import { Footer } from "@/globals/Footer";
import { Header } from "@/globals/Header";
import { getServerSideURL } from "@/utilities/getURL";
import { oneSignalEmailAdapter } from "@/utilities/email/onesignal";
import { dashboardWidgets, defaultDashboardLayout } from "@/components/Dashboard/dashboardConfig";
import { plugins } from "./plugins";
import { chargeSubscriptions } from "./tasks/chargeSubscriptions";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const cloudflareRemoteBindings = process.env.NODE_ENV === "production";
const isVitest =
  process.env.VITEST === "true" ||
  process.env.NODE_ENV === "test" ||
  process.argv.some((arg) => arg.includes("vitest"));

const shouldUseWranglerProxy =
  !isVitest &&
  (process.argv.find((value) => value.match(/^(generate|migrate):?/)) || !cloudflareRemoteBindings);

const cloudflare = shouldUseWranglerProxy
  ? await getCloudflareContextFromWrangler()
  : await getCloudflareContext({ async: true });

const requireEnv = <T>(value: T | undefined | null, name: string): T => {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const payloadSecret = requireEnv(process.env.PAYLOAD_SECRET, "PAYLOAD_SECRET");
const d1Binding = requireEnv(cloudflare.env?.D1, "D1");
const r2Binding = requireEnv(cloudflare.env?.R2, "R2");
type DashboardConfig = NonNullable<NonNullable<Config["admin"]>["dashboard"]>;

requireEnv(process.env.PAYSTACK_SECRET_KEY, "PAYSTACK_SECRET_KEY");
requireEnv(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY");

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ["@/components/BeforeLogin#BeforeLogin"],
      beforeDashboard: ["@/components/BeforeDashboard#BeforeDashboard"],
    },
    dashboard: {
      widgets: [...dashboardWidgets] as unknown as DashboardConfig["widgets"],
      defaultLayout: [...defaultDashboardLayout] as unknown as DashboardConfig["defaultLayout"],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Pages,
    Posts,
    Categories,
    Media,
    ProductAddons,
    Subscriptions,
    TaxClasses,
    ShippingClasses,
    ShippingZones,
  ],
  db: sqliteD1Adapter({
    binding: d1Binding,
    push: false,
  }),
  editor: lexicalEditor({
    features: () => [
      UnderlineFeature(),
      BoldFeature(),
      ItalicFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      LinkFeature({
        enabledCollections: ["pages"],
        fields: ({ defaultFields }) => {
          const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
            if ("name" in field && field.name === "url") return false;
            return true;
          });

          return [
            ...defaultFieldsWithoutUrl,
            {
              name: "url",
              type: "text",
              admin: {
                condition: ({ linkType }) => linkType !== "internal",
              },
              label: ({ t }) => t("fields:enterURL"),
              required: true,
            },
          ];
        },
      }),
      IndentFeature(),
      EXPERIMENTAL_TableFeature(),
    ],
  }),
  email: oneSignalEmailAdapter({
    appId: requireEnv(process.env.ONESIGNAL_APP_ID, "ONESIGNAL_APP_ID"),
    restApiKey: requireEnv(process.env.ONESIGNAL_REST_API_KEY, "ONESIGNAL_REST_API_KEY"),
    defaultFromAddress: "hi@send.automaticpallet.com",
    defaultFromName: "AutomaticPallet.com",
  }),
  endpoints: [],
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    r2Storage({
      bucket: r2Binding,
      clientUploads: true,
      collections: { media: true },
    }),
  ],
  jobs: {
    enableConcurrencyControl: true,
    tasks: [
      {
        ...chargeSubscriptions,
        schedule: [
          {
            cron: "0 6 * * *", // 6 AM daily
            queue: "default",
          },
        ],
      },
    ],
    autoRun: [
      {
        cron: "*/5 * * * *", // Check for jobs every 5 minutes
        queue: "default",
      },
      {
        cron: "*/5 * * * *",
        queue: "marketing",
      },
      {
        cron: "*/5 * * * *",
        queue: "finance",
      },
    ],
  },
  secret: payloadSecret,
  // sharp, // Disabled for Cloudflare Workers compatibility
  serverURL: getServerSideURL(),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});

function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${"__wrangler".replaceAll("_", "")}`).then(
    ({ getPlatformProxy }) => {
      const options: GetPlatformProxyOptions & {
        experimental?: { remoteBindings?: boolean };
      } = {
        environment: process.env.CLOUDFLARE_ENV,
      };

      if (cloudflareRemoteBindings) {
        options.experimental = { remoteBindings: cloudflareRemoteBindings };
      }

      return getPlatformProxy(options);
    },
  );
}
