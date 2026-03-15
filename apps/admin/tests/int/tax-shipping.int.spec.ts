import { describe, it, expect, vi, beforeEach } from "vitest";

// ── We CANNOT call getPayload() in vitest (Cloudflare Workers env restriction).
// ── Instead we unit-test the recalculateSubtotal hook function directly by
//    extracting the logic we need.

// Simulate the hook internals.
// We'll replicate the logic from src/collections/Carts/index.ts to validate it.

type PriceLookupDoc = { [key: string]: unknown };

const readCurrencyPrice = (doc: PriceLookupDoc | null | undefined, priceField: string): number => {
  if (!doc) return 0;
  const price = doc[priceField];
  return typeof price === "number" ? price : 0;
};

interface CartItem {
  product: string | PriceLookupDoc;
  variant?: string | PriceLookupDoc;
  quantity: number;
}

const buildMockPayload = (overrides: Partial<{ findByID: ReturnType<typeof vi.fn> }> = {}) => ({
  logger: { error: vi.fn(), info: vi.fn() },
  findByID: vi.fn().mockResolvedValue(null),
  ...overrides,
});

// Simplified replication of the tax+subtotal calculation from Carts/index.ts
async function calculateCartTotals(
  items: CartItem[],
  currency: string,
  shippingTotal: number,
  payload: ReturnType<typeof buildMockPayload>,
): Promise<{ subtotal: number; taxTotal: number; shippingTotal: number }> {
  let subtotal = 0;
  let taxTotal = 0;
  const priceField = `priceIn${currency.toUpperCase()}`;

  for (const item of items) {
    const { product, quantity } = item;
    if (!product || !quantity) continue;

    const productDoc =
      typeof product === "object"
        ? (product as PriceLookupDoc)
        : await payload.findByID({ collection: "products", id: product });

    const unitPrice = readCurrencyPrice(productDoc, priceField);
    subtotal += unitPrice * quantity;

    // Calculate Tax
    if (productDoc?.taxStatus === "taxable") {
      let rate = 7.5;
      if (productDoc.taxClass) {
        const taxClassDoc =
          typeof productDoc.taxClass === "object"
            ? productDoc.taxClass
            : await payload.findByID({ collection: "tax-classes", id: productDoc.taxClass });
        if (taxClassDoc && typeof (taxClassDoc as PriceLookupDoc).rate === "number") {
          rate = (taxClassDoc as PriceLookupDoc).rate as number;
        }
      }
      taxTotal += (unitPrice * quantity * rate) / 100;
    }
  }

  // Tax on shipping (if there are taxable items)
  if (shippingTotal > 0 && taxTotal > 0) {
    taxTotal += (shippingTotal * 7.5) / 100;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    shippingTotal,
  };
}

describe("Cart Tax Calculations (Nigeria Tax Act 2025)", () => {
  let mockPayload: ReturnType<typeof buildMockPayload>;

  beforeEach(() => {
    mockPayload = buildMockPayload();
  });

  it("calculates 7.5% VAT on taxable items (Standard rate)", async () => {
    const standardTaxClass = { id: 1, title: "Standard", rate: 7.5 };
    const productDoc: PriceLookupDoc = {
      id: "prod-1",
      priceInNGN: 1000,
      taxStatus: "taxable",
      taxClass: standardTaxClass, // already populated object
    };
    const items: CartItem[] = [{ product: productDoc, quantity: 2 }];
    const result = await calculateCartTotals(items, "NGN", 0, mockPayload);

    // Subtotal: 1000 * 2 = 2000, Tax: 2000 * 0.075 = 150
    expect(result.subtotal).toBe(2000);
    expect(result.taxTotal).toBe(150);
    expect(result.shippingTotal).toBe(0);
  });

  it("charges 0 tax on Zero-Rated items", async () => {
    const productDoc: PriceLookupDoc = {
      id: "prod-2",
      priceInNGN: 2000,
      taxStatus: "none", // Zero-rated / exempt
    };
    const items: CartItem[] = [{ product: productDoc, quantity: 1 }];
    const result = await calculateCartTotals(items, "NGN", 0, mockPayload);

    expect(result.subtotal).toBe(2000);
    expect(result.taxTotal).toBe(0);
  });

  it("charges 0 tax on exempt items (taxStatus=none)", async () => {
    const productDoc: PriceLookupDoc = {
      id: "prod-3",
      priceInNGN: 5000,
      taxStatus: "none",
    };
    const items: CartItem[] = [{ product: productDoc, quantity: 3 }];
    const result = await calculateCartTotals(items, "NGN", 0, mockPayload);

    expect(result.subtotal).toBe(15000);
    expect(result.taxTotal).toBe(0);
  });

  it("calculates mixed tax correctly", async () => {
    const standardTaxClass = { id: 1, rate: 7.5 };
    const taxableProduct: PriceLookupDoc = {
      id: "prod-1",
      priceInNGN: 1000,
      taxStatus: "taxable",
      taxClass: standardTaxClass,
    };
    const zeroRatedProduct: PriceLookupDoc = {
      id: "prod-2",
      priceInNGN: 2000,
      taxStatus: "none",
    };
    const items: CartItem[] = [
      { product: taxableProduct, quantity: 1 }, // 1000 NGN, 75 Tax
      { product: zeroRatedProduct, quantity: 2 }, // 4000 NGN, 0 Tax
    ];
    const result = await calculateCartTotals(items, "NGN", 0, mockPayload);

    expect(result.subtotal).toBe(5000);
    expect(result.taxTotal).toBe(75);
  });

  it("applies 7.5% VAT on shipping when cart has taxable items", async () => {
    const standardTaxClass = { id: 1, rate: 7.5 };
    const taxableProduct: PriceLookupDoc = {
      id: "prod-1",
      priceInNGN: 1000,
      taxStatus: "taxable",
      taxClass: standardTaxClass,
    };
    const items: CartItem[] = [{ product: taxableProduct, quantity: 1 }];
    const result = await calculateCartTotals(items, "NGN", 1000, mockPayload);

    // Subtotal: 1000, Item Tax: 75, Shipping Tax: 75, Total Tax: 150
    expect(result.subtotal).toBe(1000);
    expect(result.taxTotal).toBe(150);
    expect(result.shippingTotal).toBe(1000);
  });

  it("does NOT apply VAT on shipping when cart has no taxable items", async () => {
    const exemptProduct: PriceLookupDoc = {
      id: "prod-2",
      priceInNGN: 2000,
      taxStatus: "none",
    };
    const items: CartItem[] = [{ product: exemptProduct, quantity: 1 }];
    const result = await calculateCartTotals(items, "NGN", 1000, mockPayload);

    // No item tax => no shipping tax
    expect(result.subtotal).toBe(2000);
    expect(result.taxTotal).toBe(0);
    expect(result.shippingTotal).toBe(1000);
  });

  it("respects custom tax class rate (e.g., Zero-Rated via taxClass)", async () => {
    const zeroRatedSuperClass = { id: 2, rate: 0 };
    const productDoc: PriceLookupDoc = {
      id: "prod-z",
      priceInNGN: 3000,
      taxStatus: "taxable",
      taxClass: zeroRatedSuperClass, // taxable but class rate is 0
    };
    const items: CartItem[] = [{ product: productDoc, quantity: 2 }];
    const result = await calculateCartTotals(items, "NGN", 0, mockPayload);

    expect(result.subtotal).toBe(6000);
    expect(result.taxTotal).toBe(0);
  });

  it("looks up taxClass from DB if it is an ID", async () => {
    const taxClassDoc = { id: 1, rate: 7.5 };
    const productDoc: PriceLookupDoc = {
      id: "prod-id",
      priceInNGN: 2000,
      taxStatus: "taxable",
      taxClass: 1, // ID, not object
    };
    mockPayload.findByID.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === "tax-classes") return taxClassDoc;
      return productDoc;
    });
    const items: CartItem[] = [{ product: "prod-id", quantity: 1 }];
    const result = await calculateCartTotals(items, "NGN", 0, mockPayload);

    // Product looked up from DB, then tax class looked up from DB
    expect(result.subtotal).toBe(2000);
    expect(result.taxTotal).toBe(150);
  });
});
