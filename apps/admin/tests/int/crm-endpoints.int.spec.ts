import type { CollectionConfig, Config, Endpoint } from "payload";
import { describe, expect, it, vi } from "vitest";

import { crmPlugin } from "@/plugins/crm";

const buildConfig = async () => {
  const plugin = crmPlugin();

  return Promise.resolve(
    plugin({
      collections: [
        { slug: "users", fields: [] },
        { slug: "carts", fields: [] },
        { slug: "orders", fields: [] },
      ] as CollectionConfig[],
    } as Config),
  );
};

const getEndpoint = async (path: string) => {
  const config = await buildConfig();

  return config.endpoints?.find((endpoint: Endpoint) => endpoint.path === path) as Endpoint;
};

const buildRequest = ({
  body,
  payload = {},
  user,
}: {
  body?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  user?: { id?: number; roles?: string[] };
}) =>
  ({
    headers: new Headers(),
    json: async () => body ?? {},
    payload,
    user,
  }) as never;

describe("crm workflow endpoints", () => {
  it("registers workflow and Paystack endpoints", async () => {
    const config = await buildConfig();
    const paths = config.endpoints?.map((endpoint) => endpoint.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        "/crm/quotes/from-deal",
        "/crm/invoices/from-quote",
        "/crm/invoices/from-order",
        "/crm/invoices/paystack/webhook",
        "/crm/invoices/paystack/reconcile",
        "/crm/invoices/paystack/sync",
        "/crm/invoices/paystack/verify",
      ]),
    );
  });

  it("blocks unauthenticated quote creation from deals", async () => {
    const endpoint = await getEndpoint("/crm/quotes/from-deal");

    const response = await endpoint.handler(
      buildRequest({
        body: {
          dealID: 22,
          quoteNumber: "QT-22",
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("creates a quote from a deal for sales users", async () => {
    const endpoint = await getEndpoint("/crm/quotes/from-deal");
    const payload = {
      create: vi.fn().mockResolvedValue({
        id: 301,
        quoteNumber: "QT-301",
        status: "draft",
      }),
      findByID: vi.fn().mockResolvedValue({
        id: 44,
        notes: "Priority quote",
        owner: 8,
        primaryContact: 16,
        title: "Bulk pallet order",
        value: 250000,
      }),
    };

    const response = await endpoint.handler(
      buildRequest({
        body: {
          dealID: 44,
          quoteNumber: "QT-301",
        },
        payload,
        user: { id: 8, roles: ["sales"] },
      }),
    );

    expect(response.status).toBe(200);
    expect(payload.findByID).toHaveBeenCalledWith({
      collection: "crm-deals",
      depth: 0,
      id: 44,
      overrideAccess: false,
      req: expect.any(Object),
    });
    expect(payload.create).toHaveBeenCalledWith({
      collection: "crm-quotes",
      data: expect.objectContaining({
        contact: 16,
        deal: 44,
        lineItems: [
          {
            description: "Bulk pallet order",
            quantity: 1,
            unitPrice: 250000,
          },
        ],
        owner: 8,
        quoteNumber: "QT-301",
        status: "draft",
      }),
      overrideAccess: true,
      req: expect.any(Object),
    });
  });

  it("returns a validation error when invoice creation from a quote is missing identifiers", async () => {
    const endpoint = await getEndpoint("/crm/invoices/from-quote");

    const response = await endpoint.handler(
      buildRequest({
        body: {
          quoteID: 55,
        },
        user: { id: 4, roles: ["finance"] },
      }),
    );

    expect(response.status).toBe(400);
  });

  it("creates an invoice from an order for finance users", async () => {
    const endpoint = await getEndpoint("/crm/invoices/from-order");
    const payload = {
      create: vi.fn().mockResolvedValue({
        id: 401,
        invoiceNumber: "INV-401",
        status: "issued",
      }),
      findByID: vi.fn().mockResolvedValue({
        amount: 540000,
        crmContact: 12,
        currency: "NGN",
        id: 88,
        items: [
          {
            product: 10,
            quantity: 3,
            variant: 11,
          },
        ],
      }),
    };

    const response = await endpoint.handler(
      buildRequest({
        body: {
          invoiceNumber: "INV-401",
          orderID: 88,
        },
        payload,
        user: { id: 4, roles: ["finance"] },
      }),
    );

    expect(response.status).toBe(200);
    expect(payload.findByID).toHaveBeenCalledWith({
      collection: "orders",
      depth: 0,
      id: 88,
      overrideAccess: true,
      req: expect.any(Object),
    });
    expect(payload.create).toHaveBeenCalledWith({
      collection: "crm-invoices",
      data: expect.objectContaining({
        balanceDue: 540000,
        contact: 12,
        invoiceNumber: "INV-401",
        order: 88,
        paymentMethod: "paystack",
        status: "issued",
      }),
      overrideAccess: true,
      req: expect.any(Object),
    });
  });

  it("validates invoice IDs before Paystack sync or verify", async () => {
    const reconcileEndpoint = await getEndpoint("/crm/invoices/paystack/reconcile");
    const syncEndpoint = await getEndpoint("/crm/invoices/paystack/sync");
    const verifyEndpoint = await getEndpoint("/crm/invoices/paystack/verify");
    const req = buildRequest({
      body: {},
      user: { id: 4, roles: ["finance"] },
    });

    const syncResponse = await syncEndpoint.handler(req);
    const verifyResponse = await verifyEndpoint.handler(req);
    const reconcileUnauthorized = await reconcileEndpoint.handler(
      buildRequest({
        user: { id: 2, roles: ["sales"] },
      }),
    );

    expect(syncResponse.status).toBe(400);
    expect(verifyResponse.status).toBe(400);
    expect(reconcileUnauthorized.status).toBe(401);
  });

  it("rejects Paystack webhook calls with a bad signature", async () => {
    const endpoint = await getEndpoint("/crm/invoices/paystack/webhook");
    const response = await endpoint.handler({
      headers: new Headers({
        "x-paystack-signature": "bad-signature",
      }),
      payload: {},
      text: async () => JSON.stringify({ event: "paymentrequest.success" }),
    } as never);

    expect(response.status).toBe(401);
  });
});
