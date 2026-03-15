import { describe, expect, it, vi } from "vitest";

import {
  createInvoiceFromOrder,
  createInvoiceFromQuote,
  createQuoteFromDeal,
} from "@/plugins/crm/workflows";

describe("crm workflows", () => {
  it("creates a quote from a deal using the primary contact, owner, and deal value", async () => {
    const create = vi.fn().mockResolvedValue({ id: 301 });

    await createQuoteFromDeal({
      deal: {
        id: 21,
        notes: "Handle with premium packaging.",
        owner: 4,
        primaryContact: 7,
        title: "Warehouse Expansion",
        value: 250000,
      },
      payload: {
        create,
      } as never,
      quoteNumber: "Q-301",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-quotes",
        data: expect.objectContaining({
          contact: 7,
          deal: 21,
          owner: 4,
          quoteNumber: "Q-301",
          status: "draft",
          lineItems: [
            expect.objectContaining({
              description: "Warehouse Expansion",
              quantity: 1,
              unitPrice: 250000,
            }),
          ],
        }),
        overrideAccess: true,
      }),
    );
  });

  it("creates an invoice from an accepted quote with paystack as the default payment method", async () => {
    const create = vi.fn().mockResolvedValue({ id: 401 });

    await createInvoiceFromQuote({
      dueDate: "2026-03-31T00:00:00.000Z",
      invoiceNumber: "INV-401",
      payload: {
        create,
      } as never,
      quote: {
        id: 31,
        company: 8,
        contact: 7,
        currency: "NGN",
        lineItems: [
          {
            product: 100,
            quantity: 2,
            unitPrice: 5000,
          },
        ],
        owner: 4,
      },
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-invoices",
        data: expect.objectContaining({
          company: 8,
          contact: 7,
          dueDate: "2026-03-31T00:00:00.000Z",
          invoiceNumber: "INV-401",
          owner: 4,
          paymentMethod: "paystack",
          quote: 31,
          status: "issued",
        }),
      }),
    );
  });

  it("creates an invoice from an order using crm contact and ecommerce item references", async () => {
    const create = vi.fn().mockResolvedValue({ id: 501 });

    await createInvoiceFromOrder({
      dueDate: "2026-04-05T00:00:00.000Z",
      invoiceNumber: "INV-501",
      order: {
        id: 91,
        amount: 120000,
        crmContact: 7,
        currency: "NGN",
        items: [
          {
            product: 100,
            quantity: 4,
            variant: 200,
          },
        ],
      },
      payload: {
        create,
      } as never,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-invoices",
        data: expect.objectContaining({
          balanceDue: 120000,
          contact: 7,
          dueDate: "2026-04-05T00:00:00.000Z",
          invoiceNumber: "INV-501",
          order: 91,
          paymentMethod: "paystack",
          total: 120000,
          lineItems: [
            expect.objectContaining({
              product: 100,
              quantity: 4,
              variant: 200,
            }),
          ],
        }),
      }),
    );
  });

  it("rejects order-to-invoice generation when no crm contact is available", async () => {
    await expect(
      createInvoiceFromOrder({
        invoiceNumber: "INV-999",
        order: {
          id: 99,
          items: [],
        },
        payload: {
          create: vi.fn(),
        } as never,
      }),
    ).rejects.toThrow("A CRM contact is required to generate an invoice from an order.");
  });
});
