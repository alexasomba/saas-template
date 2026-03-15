import { describe, expect, it, vi } from "vitest";

import { recalculateCRMInvoiceTotals, recalculateCRMQuoteTotals } from "@/plugins/crm/pricing";

type QuoteHookArgs = Parameters<typeof recalculateCRMQuoteTotals>[0];
type InvoiceHookArgs = Parameters<typeof recalculateCRMInvoiceTotals>[0];

describe("crm pricing", () => {
  it("calculates quote totals from ecommerce product and variant references", async () => {
    const findByID = vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === "variants") {
        return {
          id: 11,
          priceInNGN: 7500,
          title: "Blue / Medium",
        };
      }

      return {
        id: 10,
        priceInNGN: 5000,
        title: "Warehouse Pallet",
      };
    });

    const result = await recalculateCRMQuoteTotals({
      data: {
        currency: "NGN",
        discount: 1000,
        tax: 500,
        lineItems: [
          {
            product: 10,
            quantity: 2,
          },
          {
            product: 10,
            quantity: 3,
            variant: 11,
          },
        ],
      },
      req: {
        payload: {
          findByID,
        },
      } as any,
    } as any);

    expect(result).toMatchObject({
      currency: "NGN",
      discount: 1000,
      subtotal: 32500,
      tax: 500,
      total: 32000,
    });
    expect(result?.lineItems).toEqual([
      expect.objectContaining({
        description: "Warehouse Pallet",
        lineTotal: 10000,
        quantity: 2,
        unitPrice: 5000,
      }),
      expect.objectContaining({
        description: "Blue / Medium",
        lineTotal: 22500,
        quantity: 3,
        unitPrice: 7500,
      }),
    ]);
  });

  it("defaults invoice balance due to the computed total when not explicitly provided", async () => {
    const result = await recalculateCRMInvoiceTotals({
      data: {
        currency: "USD",
        lineItems: [
          {
            description: "Custom handling fee",
            quantity: 2,
            unitPrice: 125,
          },
        ],
        tax: 25,
      },
      req: {
        payload: {
          findByID: vi.fn(),
        },
      } as any,
    } as any);

    expect(result).toMatchObject({
      balanceDue: 275,
      currency: "USD",
      subtotal: 250,
      tax: 25,
      total: 275,
    });
    expect(result?.lineItems).toEqual([
      expect.objectContaining({
        description: "Custom handling fee",
        lineTotal: 250,
        quantity: 2,
        unitPrice: 125,
      }),
    ]);
  });
});
