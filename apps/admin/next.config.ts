import { withPayload } from "@payloadcms/next/withPayload";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import { shouldUseCloudflareImageLoader } from "./src/utilities/runtimeEnv";
import redirects from "./redirects.js";

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8787";
const useCloudflareImageLoader = shouldUseCloudflareImageLoader(process.env);

const remotePatterns: RemotePattern[] = [NEXT_PUBLIC_SERVER_URL].map((item) => {
  const url = new URL(item);

  const protocol = url.protocol.replace(":", "") as "http" | "https";
  const pathname = url.pathname === "/" ? "/**" : `${url.pathname.replace(/\/$/, "")}/**`;

  return {
    hostname: url.hostname,
    protocol,
    port: url.port || undefined,
    pathname,
  };
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ["jose", "pg-cloudflare"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns,
    ...(useCloudflareImageLoader
      ? {
          loader: "custom" as const,
          loaderFile: "./src/cloudflareImageLoader.ts",
        }
      : {
          unoptimized: true,
        }),
  },
  reactStrictMode: true,
  redirects,
  webpack: (webpackConfig: any) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    return webpackConfig;
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
