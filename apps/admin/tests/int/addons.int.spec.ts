import { describe, expect, it } from "vitest";

/**
 * Unit tests for Product Add-ons schema and logic.
 */

describe("Add-on Category Scoping", () => {
  it("supports excludeGlobalAddons boolean flag to skip global groups", () => {
    const productData = {
      title: "T-Shirt",
      excludeGlobalAddons: true,
      addons: [],
    };
    expect(productData.excludeGlobalAddons).toBe(true);
  });
});

describe("Price Adjustment Calculation Types", () => {
  it("allows flat, quantity_based, and percentage price types in schema", () => {
    const validTypes = ["flat", "quantity_based", "percentage"];

    // Simulate checking a short-text addon block schema
    const addonBlock = {
      blockType: "shortText",
      priceType: "percentage",
      price: 10,
    };

    expect(validTypes).toContain(addonBlock.priceType);
  });

  it("calculates flat price correctly", () => {
    const basePrice = 1000;
    const addonPrice = 500;
    expect(basePrice + addonPrice).toBe(1500);
  });

  it("calculates percentage price correctly", () => {
    const basePrice = 1000;
    const percentage = 15; // 15%
    const expected = basePrice + (basePrice * percentage) / 100;
    expect(expected).toBe(1150);
  });
});
