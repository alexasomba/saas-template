import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPaystack } from "@alexasomba/paystack-node";
import type { CollectionConfig, Config } from "payload";

vi.mock("@alexasomba/paystack-node", () => {
  const customer_create = vi.fn().mockResolvedValue({
    data: {
      data: {
        customer_code: "CUS_paystack",
      },
    },
    error: null,
  });

  const paymentRequest_create = vi.fn().mockResolvedValue({
    data: {
      data: {
        id: 501,
        offline_reference: "OFF-501",
        pdf_url: "https://paystack.test/invoice.pdf",
        request_code: "PRQ_501",
        status: "pending",
      },
    },
    error: null,
  });

  const paymentRequest_update = vi.fn().mockResolvedValue({
    data: {
      data: {
        id: 501,
        offline_reference: "OFF-501",
        pdf_url: "https://paystack.test/invoice.pdf",
        request_code: "PRQ_501",
        status: "pending",
      },
    },
    error: null,
  });

  const paymentRequest_verify = vi.fn().mockResolvedValue({
    data: {
      data: {
        id: 501,
        paid: true,
        status: "pending",
      },
    },
    error: null,
  });

  return {
    createPaystack: vi.fn().mockReturnValue({
      customer_create,
      paymentRequest_create,
      paymentRequest_update,
      paymentRequest_verify,
    }),
  };
});

import {
  syncInvoiceCRMActivityAfterChange,
  syncQuoteCRMActivityAfterChange,
} from "@/plugins/crm/hooks";
import { CRM_INVOICES_COLLECTION } from "@/plugins/crm/constants";
import { crmPlugin } from "@/plugins/crm";
import {
  processPaystackInvoiceWebhook,
  reconcilePaystackInvoices,
  syncInvoicePaystackAfterChange,
  verifyPaystackWebhookSignature,
} from "@/plugins/crm/paystackInvoices";

type QuoteChangeArgs = Parameters<typeof syncQuoteCRMActivityAfterChange>[0];
type InvoiceChangeArgs = Parameters<typeof syncInvoiceCRMActivityAfterChange>[0];
type InvoiceSyncArgs = Parameters<typeof syncInvoicePaystackAfterChange>[0];

describe("crm commercial workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_mock");

    vi.mocked(createPaystack).mockReturnValue({
      customer_create: vi.fn().mockResolvedValue({
        data: {
          data: {
            customer_code: "CUS_paystack",
          },
        },
        error: null,
      }),
      paymentRequest_create: vi.fn().mockResolvedValue({
        data: {
          data: {
            id: 501,
            offline_reference: "OFF-501",
            pdf_url: "https://paystack.test/invoice.pdf",
            request_code: "PRQ_501",
            status: "pending",
          },
        },
        error: null,
      }),
      paymentRequest_update: vi.fn().mockResolvedValue({
        data: {
          data: {
            id: 501,
            offline_reference: "OFF-501",
            pdf_url: "https://paystack.test/invoice.pdf",
            request_code: "PRQ_501",
            status: "pending",
          },
        },
        error: null,
      }),
      paymentRequest_verify: vi.fn().mockResolvedValue({
        data: {
          data: {
            id: 501,
            paid: true,
            status: "pending",
          },
        },
        error: null,
      }),
    } as any);
  });

  it("records quote and invoice activities on creation", async () => {
    const create = vi.fn().mockResolvedValue({ id: 901 });
    const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 });

    await syncQuoteCRMActivityAfterChange({
      doc: {
        id: 71,
        quoteNumber: "Q-71",
        contact: 12,
        createdAt: "2026-03-09T08:00:00.000Z",
      } as QuoteChangeArgs["doc"],
      operation: "create",
      req: {
        payload: {
          create,
          find,
        },
      } as any,
    } as QuoteChangeArgs);

    await syncInvoiceCRMActivityAfterChange({
      doc: {
        id: 81,
        invoiceNumber: "INV-81",
        contact: 12,
        createdAt: "2026-03-09T09:00:00.000Z",
      } as InvoiceChangeArgs["doc"],
      operation: "create",
      req: {
        payload: {
          create,
          find,
        },
      } as any,
    } as InvoiceChangeArgs);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-activities",
        data: expect.objectContaining({
          contact: 12,
          type: "quote-created",
        }),
      }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-activities",
        data: expect.objectContaining({
          contact: 12,
          type: "invoice-created",
        }),
      }),
    );
  });

  it("records payment-specific CRM activities when an invoice balance is reduced", async () => {
    const create = vi.fn().mockResolvedValue({ id: 902 });
    const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 });

    await syncInvoiceCRMActivityAfterChange({
      doc: {
        balanceDue: 0,
        contact: 12,
        id: 82,
        invoiceNumber: "INV-82",
        status: "paid",
        updatedAt: "2026-03-09T10:00:00.000Z",
      } as InvoiceChangeArgs["doc"],
      operation: "update",
      previousDoc: {
        balanceDue: 50000,
        status: "issued",
      } as InvoiceChangeArgs["previousDoc"],
      req: {
        payload: {
          create,
          find,
        },
      } as any,
    } as InvoiceChangeArgs);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-activities",
        data: expect.objectContaining({
          contact: 12,
          eventKey: "invoice-paid:82:0",
          summary: "Invoice INV-82 was fully paid.",
          type: "invoice-paid",
        }),
      }),
    );
  });

  it("configures invoices for paystack as the primary method with optional bank transfer instructions", async () => {
    const plugin = crmPlugin();
    const config = await Promise.resolve(plugin({ collections: [] } as any));
    const invoiceCollection = config.collections?.find(
      (candidate: CollectionConfig) => candidate.slug === CRM_INVOICES_COLLECTION,
    ) as CollectionConfig;

    const paymentMethodField = invoiceCollection.fields.find(
      (field) => "name" in field && field.name === "paymentMethod",
    );
    const paystackField = invoiceCollection.fields.find(
      (field) => "name" in field && field.name === "paystack",
    );
    const bankTransferField = invoiceCollection.fields.find(
      (field) => "name" in field && field.name === "bankTransferInstructions",
    );

    expect(paymentMethodField).toMatchObject({
      defaultValue: "paystack",
      name: "paymentMethod",
    });
    expect(paystackField).toMatchObject({
      name: "paystack",
      type: "group",
    });
    expect(bankTransferField).toMatchObject({
      name: "bankTransferInstructions",
      type: "group",
    });
  });

  it("skips paystack sync for bank transfer invoices", async () => {
    const update = vi.fn();
    const findByID = vi.fn();

    await syncInvoicePaystackAfterChange({
      context: {},
      doc: {
        id: 82,
        invoiceNumber: "INV-82",
        paymentMethod: "bank-transfer",
        status: "issued",
        total: 12000,
      } as InvoiceSyncArgs["doc"],
      req: {
        payload: {
          findByID,
          update,
        },
      } as any,
    } as InvoiceSyncArgs);

    expect(findByID).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("reconciles open Paystack invoices and updates their local status", async () => {
    const find = vi.fn().mockResolvedValueOnce({
      docs: [
        {
          balanceDue: 12000,
          id: 91,
          paymentMethod: "paystack",
          paystack: {
            paymentRequestID: 501,
          },
          status: "issued",
        },
        {
          balanceDue: 8000,
          id: 92,
          paymentMethod: "paystack",
          paystack: {},
          status: "overdue",
        },
      ],
      totalPages: 1,
    });
    const verifyInvoiceStatus = vi.fn().mockResolvedValue({
      balanceDue: 0,
      id: 91,
      status: "paid",
    });

    const summary = await reconcilePaystackInvoices({
      payload: {
        find,
      } as never,
      req: {
        payload: {},
      } as never,
      verifyInvoiceStatus,
    });

    expect(summary).toEqual({
      failed: 0,
      skipped: 1,
      updated: 1,
      verified: 1,
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-invoices",
        where: expect.objectContaining({
          and: expect.arrayContaining([
            {
              paymentMethod: {
                equals: "paystack",
              },
            },
          ]),
        }),
      }),
    );
    expect(verifyInvoiceStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceID: 91,
        invoice: expect.objectContaining({
          id: 91,
        }),
      }),
    );
  });

  it("verifies Paystack webhook signatures and ignores unsupported invoice events", async () => {
    const body = '{"event":"paymentrequest.success"}';

    expect(
      verifyPaystackWebhookSignature({
        body,
        secretKey: "sk_test_mock",
        signature: createHmac("sha512", "sk_test_mock").update(body).digest("hex"),
      }),
    ).toBe(true);

    const result = await processPaystackInvoiceWebhook({
      event: {
        event: "charge.success",
      },
      payload: {
        create: vi.fn().mockResolvedValue({ id: 7000 }),
        find: vi.fn(),
      } as never,
      req: {
        payload: {},
      } as never,
    });

    expect(result).toEqual({
      ignored: true,
      reason: "unsupported_event",
    });
  });

  it("matches a Paystack payment request webhook to a CRM invoice and verifies it", async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [
        {
          id: 103,
          paystack: {
            paymentRequestID: 501,
          },
          status: "issued",
        },
      ],
    });
    const create = vi.fn().mockResolvedValue({
      id: 7001,
    });
    const verifyInvoiceStatus = vi.fn().mockResolvedValue({
      id: 103,
      status: "paid",
    });

    const result = await processPaystackInvoiceWebhook({
      event: {
        data: {
          id: 501,
        },
        event: "paymentrequest.success",
      },
      payload: {
        create,
        find,
      } as never,
      req: {
        payload: {},
      } as never,
      verifyInvoiceStatus,
    });

    expect(result).toEqual({
      ignored: false,
      invoiceID: 103,
      status: "paid",
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-invoices",
        where: {
          "paystack.paymentRequestID": {
            equals: 501,
          },
        },
      }),
    );
    expect(verifyInvoiceStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceID: 103,
      }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-webhook-events",
        data: expect.objectContaining({
          eventKey: "paymentrequest.success:501",
          provider: "paystack",
        }),
      }),
    );
  });

  it("ignores duplicate Paystack webhook deliveries before invoice processing", async () => {
    const find = vi.fn();
    const verifyInvoiceStatus = vi.fn();

    const result = await processPaystackInvoiceWebhook({
      event: {
        data: {
          id: 501,
        },
        event: "paymentrequest.success",
      },
      payload: {
        create: vi
          .fn()
          .mockRejectedValue(new Error("duplicate key value violates unique constraint")),
        find,
      } as never,
      req: {
        payload: {},
      } as never,
      verifyInvoiceStatus,
    });

    expect(result).toEqual({
      ignored: true,
      reason: "duplicate_event",
    });
    expect(find).not.toHaveBeenCalled();
    expect(verifyInvoiceStatus).not.toHaveBeenCalled();
  });
});
