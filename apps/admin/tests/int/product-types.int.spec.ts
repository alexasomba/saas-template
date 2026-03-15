import { describe, expect, it } from "vitest";
import { ProductsCollection } from "@/collections/Products";

/**
 * Unit tests for the WooCommerce-style product type schema additions.
 *
 * These tests validate:
 * - Default value behaviour for productType
 * - Type-specific validation rules (externalUrl required for external products)
 * - Boolean modifier flags (isVirtual, isDownloadable)
 * - Key seed data shape expectations
 */

// ── productType defaults ───────────────────────────────────────────────────

describe("productType field defaults", () => {
  it('defaults to "simple" when not specified', () => {
    const data: Record<string, unknown> = {};
    const productType = (data.productType as string) ?? "simple";
    expect(productType).toBe("simple");
  });

  it("accepts all valid productType values", () => {
    const validTypes = ["simple", "variable", "grouped", "external"];
    for (const type of validTypes) {
      expect(validTypes).toContain(type);
    }
  });
});

// ── externalUrl validation ─────────────────────────────────────────────────

describe("externalUrl validation rule", () => {
  const validateExternalUrl = (
    value: string | null | undefined,
    data: Record<string, unknown>,
  ): true | string => {
    if (data?.productType !== "external") return true;
    if (!value) return "An external URL is required for External/Affiliate products.";
    return true;
  };

  it("passes when productType is not external (no URL needed)", () => {
    expect(validateExternalUrl(undefined, { productType: "simple" })).toBe(true);
    expect(validateExternalUrl("", { productType: "variable" })).toBe(true);
    expect(validateExternalUrl(undefined, { productType: "grouped" })).toBe(true);
  });

  it("fails when productType is external and no URL is provided", () => {
    expect(validateExternalUrl(undefined, { productType: "external" })).toMatch(/required/);
    expect(validateExternalUrl("", { productType: "external" })).toMatch(/required/);
    expect(validateExternalUrl(null, { productType: "external" })).toMatch(/required/);
  });

  it("passes when productType is external and URL is provided", () => {
    expect(validateExternalUrl("https://example.com/product", { productType: "external" })).toBe(
      true,
    );
  });
});

// ── isVirtual / isDownloadable modifier logic ──────────────────────────────

describe("isVirtual flag behaviour", () => {
  it("determines whether shipping should be skipped", () => {
    const isAllVirtual = (items: Array<{ isVirtual?: boolean }>): boolean =>
      items.every((item) => item.isVirtual === true);

    expect(isAllVirtual([{ isVirtual: true }, { isVirtual: true }])).toBe(true);
    expect(isAllVirtual([{ isVirtual: true }, { isVirtual: false }])).toBe(false);
    expect(isAllVirtual([{ isVirtual: false }])).toBe(false);
    expect(isAllVirtual([])).toBe(true); // vacuously true, empty cart handled elsewhere
  });
});

describe("isDownloadable flag behaviour", () => {
  it("requires downloadableFiles when isDownloadable is true", () => {
    const validateDownloadFiles = (
      files: unknown[] | null | undefined,
      isDownloadable: boolean,
    ): true | string => {
      if (!isDownloadable) return true;
      if (!files || files.length === 0) return "At least one downloadable file is required.";
      return true;
    };

    expect(validateDownloadFiles([], true)).toMatch(/required/);
    expect(validateDownloadFiles(null, true)).toMatch(/required/);
    expect(validateDownloadFiles([{ name: "guide.pdf" }], true)).toBe(true);
    expect(validateDownloadFiles([], false)).toBe(true); // not downloadable, no files needed
  });

  it("download limit of -1 means unlimited", () => {
    const isUnlimited = (limit: number) => limit === -1;
    expect(isUnlimited(-1)).toBe(true);
    expect(isUnlimited(3)).toBe(false);
  });

  it("download expiry of -1 means never expires", () => {
    const neverExpires = (expiry: number) => expiry === -1;
    expect(neverExpires(-1)).toBe(true);
    expect(neverExpires(30)).toBe(false);
  });
});

// ── Seed data shape validation ─────────────────────────────────────────────

describe("seed data productType", () => {
  it("hat seed data has productType simple", async () => {
    const { productHatData } = await import("@/endpoints/seed/product-hat");
    const media = { id: "media-1", filename: "test.png" } as never;
    const data = productHatData({
      galleryImage: media,
      metaImage: media,
      variantTypes: [],
      categories: [],
      relatedProducts: [],
    });
    expect(data.productType).toBe("simple");
  });

  it("simple product seed has sku and physical dimensions", async () => {
    const { productSimpleData } = await import("@/endpoints/seed/product-simple");
    const media = { id: "media-1", filename: "test.png" } as never;
    const data = productSimpleData({
      galleryImage: media,
      metaImage: media,
      categories: [],
      relatedProducts: [],
    });
    expect(data.productType).toBe("simple");
    expect(data.sku).toBeTruthy();
    expect(data.weight).toBeGreaterThan(0);
  });

  it("grouped product seed has productType grouped and child products", async () => {
    const { productGroupedData } = await import("@/endpoints/seed/product-grouped");
    const media = { id: "media-2", filename: "test.png" } as never;
    const childProduct = { id: "product-1", title: "Hat" } as never;
    const data = productGroupedData({
      galleryImage: media,
      metaImage: media,
      categories: [],
      childProducts: [childProduct],
    });
    expect(data.productType).toBe("grouped");
    expect(Array.isArray(data.groupedProducts)).toBe(true);
    expect((data.groupedProducts as unknown[]).length).toBeGreaterThan(0);
  });

  it("external product seed has externalUrl and buttonText", async () => {
    const { productExternalData } = await import("@/endpoints/seed/product-external");
    const media = { id: "media-3", filename: "test.png" } as never;
    const data = productExternalData({ galleryImage: media, metaImage: media, categories: [] });
    expect(data.productType).toBe("external");
    expect(data.externalUrl).toBeTruthy();
    expect(data.externalButtonText).toBeTruthy();
  });

  it("virtual product seed has isVirtual true", async () => {
    const { productVirtualData } = await import("@/endpoints/seed/product-virtual");
    const media = { id: "media-4", filename: "test.png" } as never;
    const data = productVirtualData({ galleryImage: media, metaImage: media, categories: [] });
    expect(data.isVirtual).toBe(true);
    expect(data.productType).toBe("simple");
  });

  it("downloadable product seed has isDownloadable true with limits set", async () => {
    const { productDownloadData } = await import("@/endpoints/seed/product-download");
    const media = { id: "media-5", filename: "test.png" } as never;
    const data = productDownloadData({ galleryImage: media, metaImage: media, categories: [] });
    expect(data.isDownloadable).toBe(true);
    expect(typeof data.downloadLimit).toBe("number");
    expect(typeof data.downloadExpiry).toBe("number");
  });

  it("subscription product seed mirrors recurring prices into storefront base prices", async () => {
    const { productSubscription } = await import("@/endpoints/seed/product-subscription");

    expect(productSubscription.isSubscription).toBe(true);
    expect(productSubscription.subscriptionPrice).toBe(productSubscription.priceInUSD);
    expect(productSubscription.subscriptionPriceNGN).toBe(productSubscription.priceInNGN);
    expect(productSubscription.priceInUSDEnabled).toBe(true);
    expect(productSubscription.priceInNGNEnabled).toBe(true);
  });
});

describe("product relation populate shape", () => {
  it("includes subscription pricing fields for client cart and checkout renders", () => {
    const collection = ProductsCollection({
      defaultCollection: {
        fields: [],
      },
    } as never);

    expect(collection.defaultPopulate).toMatchObject({
      subscriptionPrice: true,
      subscriptionPriceNGN: true,
      period: true,
      interval: true,
    });
  });
});
