import {
  getConfiguredServerURL,
  isLocalServerURL,
  shouldGenerateStaticParamsFromDB,
  shouldUseCloudflareImageLoader,
} from "@/utilities/runtimeEnv";
import { describe, expect, it } from "vitest";

describe("runtime environment helpers", () => {
  it("treats localhost-style server URLs as local runtime targets", () => {
    expect(isLocalServerURL("http://localhost:8787")).toBe(true);
    expect(isLocalServerURL("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalServerURL("http://0.0.0.0:8787")).toBe(true);
    expect(isLocalServerURL("https://automaticpallet.com")).toBe(false);
  });

  it("uses localhost as the default server URL", () => {
    expect(getConfiguredServerURL({})).toBe("http://localhost:8787");
  });

  it("disables the Cloudflare image loader for localhost development", () => {
    expect(
      shouldUseCloudflareImageLoader({
        NEXT_PUBLIC_SERVER_URL: "http://localhost:8787",
      }),
    ).toBe(false);
  });

  it("keeps the Cloudflare image loader enabled for deployed hosts", () => {
    expect(
      shouldUseCloudflareImageLoader({
        NEXT_PUBLIC_SERVER_URL: "https://shop.automaticpallet.com",
      }),
    ).toBe(true);
  });

  it("skips database-backed static params during local builds", () => {
    expect(
      shouldGenerateStaticParamsFromDB({
        NEXT_PUBLIC_IS_BUILDING: "true",
        NEXT_PUBLIC_SERVER_URL: "http://localhost:8787",
      }),
    ).toBe(false);
  });

  it("keeps database-backed static params for deployed builds", () => {
    expect(
      shouldGenerateStaticParamsFromDB({
        NEXT_PUBLIC_IS_BUILDING: "true",
        NEXT_PUBLIC_SERVER_URL: "https://shop.automaticpallet.com",
      }),
    ).toBe(true);
  });
});
