import { createPaystack } from "@alexasomba/paystack-node";
import type { CollectionAfterChangeHook, Payload, PayloadRequest } from "payload";
import { createHmac, timingSafeEqual } from "crypto";

import { CRM_INVOICES_COLLECTION, CRM_WEBHOOK_EVENTS_COLLECTION } from "./constants";

const shouldSyncInvoice = (doc: Record<string, unknown>) =>
  doc.paymentMethod === "paystack" &&
  ["issued", "partially_paid", "overdue"].includes(String(doc.status || ""));

const getContactID = (value: unknown) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "number") {
    return value.id;
  }
  return undefined;
};

const getContactDetails = async ({
  contact,
  req,
}: {
  contact: unknown;
  req: Parameters<CollectionAfterChangeHook>[0]["req"];
}) => {
  if (contact && typeof contact === "object" && "email" in contact) {
    return contact as {
      email?: string | null;
      id?: number;
      name?: string | null;
      paystackCustomerCode?: string | null;
      phone?: string | null;
    };
  }

  const contactID = getContactID(contact);
  if (!contactID) {
    return null;
  }

  return (await req.payload.findByID({
    collection: "crm-contacts",
    id: contactID,
    depth: 0,
    overrideAccess: true,
    req,
  })) as {
    email?: string | null;
    id?: number;
    name?: string | null;
    paystackCustomerCode?: string | null;
    phone?: string | null;
  };
};

const splitName = (name?: string | null) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || undefined,
  };
};

export const syncInvoicePaystackAfterChange: CollectionAfterChangeHook = async ({
  context,
  doc,
  req,
}) => {
  if (context.skipInvoicePaystackSync) {
    return doc;
  }

  if (!shouldSyncInvoice(doc as Record<string, unknown>)) {
    return doc;
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return doc;
  }

  const contact = await getContactDetails({
    contact: doc.contact,
    req,
  });

  if (!contact?.email) {
    return doc;
  }

  const paystack = createPaystack({ secretKey });
  const { firstName, lastName } = splitName(contact.name);

  let customerCode = doc.paystack?.customerCode || contact.paystackCustomerCode || undefined;

  if (!customerCode) {
    const { data, error } = await paystack.customer_create({
      body: {
        email: contact.email,
        first_name: firstName,
        last_name: lastName,
        phone: contact.phone || undefined,
      },
    });

    if (error || !data?.data?.customer_code) {
      throw new Error("Failed to create Paystack customer for CRM invoice");
    }

    customerCode = data.data.customer_code;

    if (contact.id) {
      await req.payload.update({
        collection: "crm-contacts",
        id: contact.id,
        data: {
          paystackCustomerCode: customerCode,
        },
        overrideAccess: true,
        req,
      });
    }
  }

  const paymentRequestBody = {
    amount: typeof doc.total === "number" ? doc.total : 0,
    currency: typeof doc.currency === "string" ? doc.currency : "NGN",
    customer: customerCode,
    description: typeof doc.notes === "string" ? doc.notes : `Invoice ${doc.invoiceNumber}`,
    due_date: typeof doc.dueDate === "string" ? doc.dueDate : undefined,
    draft: false,
    has_invoice: true,
    invoice_number: Number.parseInt(String(doc.invoiceNumber).replace(/\D/g, ""), 10) || undefined,
    line_items: Array.isArray(doc.lineItems)
      ? doc.lineItems.map((item: Record<string, unknown>) => ({
          amount: item.lineTotal,
          description: item.description,
          name: item.description,
          quantity: item.quantity,
        }))
      : undefined,
    send_notification: false,
  };

  const existingPaymentRequestID =
    typeof doc.paystack?.paymentRequestID === "number" ? doc.paystack.paymentRequestID : undefined;

  const response = existingPaymentRequestID
    ? await paystack.paymentRequest_update({
        body: paymentRequestBody,
        params: {
          path: {
            id: existingPaymentRequestID,
          },
        },
      })
    : await paystack.paymentRequest_create({
        body: paymentRequestBody,
      });

  if (response.error || !response.data?.data) {
    throw new Error("Failed to sync Paystack payment request for CRM invoice");
  }

  const paymentRequest = response.data.data as Record<string, unknown>;

  await req.payload.update({
    collection: "crm-invoices",
    id: doc.id,
    context: {
      skipInvoicePaystackSync: true,
    },
    data: {
      paystack: {
        customerCode,
        lastSyncedAt: new Date().toISOString(),
        offlineReference:
          typeof paymentRequest.offline_reference === "string"
            ? paymentRequest.offline_reference
            : undefined,
        paymentRequestID:
          typeof paymentRequest.id === "number" ? paymentRequest.id : existingPaymentRequestID,
        paymentRequestStatus:
          typeof paymentRequest.status === "string" ? paymentRequest.status : undefined,
        pdfURL: typeof paymentRequest.pdf_url === "string" ? paymentRequest.pdf_url : undefined,
        requestCode:
          typeof paymentRequest.request_code === "string" ? paymentRequest.request_code : undefined,
      },
    },
    overrideAccess: true,
    req,
  });

  return doc;
};

export const syncInvoicePaystackByID = async ({
  invoiceID,
  req,
}: {
  invoiceID: number;
  req: Parameters<CollectionAfterChangeHook>[0]["req"];
}) => {
  const invoice = await req.payload.findByID({
    collection: CRM_INVOICES_COLLECTION,
    id: invoiceID,
    depth: 1,
    overrideAccess: true,
    req,
  });

  await syncInvoicePaystackAfterChange({
    context: {},
    doc: invoice,
    req,
  } as Parameters<typeof syncInvoicePaystackAfterChange>[0]);

  return invoice;
};

const mapPaystackPaymentRequestStatus = (status?: string, paid?: boolean) => {
  if (paid) return "paid";

  switch (status) {
    case "pending":
      return "issued";
    case "draft":
      return "draft";
    case "archived":
      return "void";
    default:
      return undefined;
  }
};

export const verifyInvoicePaystackStatusByID = async ({
  invoice: initialInvoice,
  invoiceID,
  req,
}: {
  invoice?: Record<string, unknown>;
  invoiceID: number;
  req: Parameters<CollectionAfterChangeHook>[0]["req"];
}) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is required to verify CRM invoices.");
  }

  const invoice =
    initialInvoice ||
    (await req.payload.findByID({
      collection: CRM_INVOICES_COLLECTION,
      id: invoiceID,
      depth: 0,
      overrideAccess: true,
      req,
    }));

  const paystackData = invoice.paystack as Record<string, unknown> | undefined;
  const paymentRequestID =
    typeof paystackData?.paymentRequestID === "number" ? paystackData.paymentRequestID : undefined;

  if (!paymentRequestID) {
    throw new Error("Invoice does not have a Paystack payment request ID.");
  }

  const paystack = createPaystack({ secretKey });
  const { data, error } = await paystack.paymentRequest_verify({
    params: {
      path: {
        id: paymentRequestID,
      },
    },
  });

  if (error || !data?.data) {
    throw new Error("Failed to verify Paystack payment request for CRM invoice");
  }

  const paymentRequest = data.data as Record<string, unknown>;
  const nextStatus = mapPaystackPaymentRequestStatus(
    typeof paymentRequest.status === "string" ? paymentRequest.status : undefined,
    Boolean(paymentRequest.paid),
  );

  return req.payload.update({
    collection: CRM_INVOICES_COLLECTION,
    id: invoiceID,
    context: {
      skipInvoicePaystackSync: true,
    },
    data: {
      ...(nextStatus ? { status: nextStatus } : {}),
      ...(paymentRequest.paid ? { balanceDue: 0, paidAt: new Date().toISOString() } : {}),
      paystack: {
        ...(invoice.paystack || {}),
        lastSyncedAt: new Date().toISOString(),
        paymentRequestStatus:
          typeof paymentRequest.status === "string" ? paymentRequest.status : undefined,
      },
    },
    overrideAccess: true,
    req,
  });
};

type ReconcilePaystackInvoicesArgs = {
  limit?: number;
  payload: Payload;
  req: PayloadRequest;
  verifyInvoiceStatus?: typeof verifyInvoicePaystackStatusByID;
};

export const reconcilePaystackInvoices = async ({
  limit = 50,
  payload,
  req,
  verifyInvoiceStatus = verifyInvoicePaystackStatusByID,
}: ReconcilePaystackInvoicesArgs) => {
  let failed = 0;
  let page = 1;
  let skipped = 0;
  let updated = 0;
  let verified = 0;

  while (true) {
    const result = await payload.find({
      collection: CRM_INVOICES_COLLECTION,
      depth: 0,
      limit,
      overrideAccess: true,
      page,
      req,
      where: {
        and: [
          {
            paymentMethod: {
              equals: "paystack",
            },
          },
          {
            status: {
              in: ["issued", "partially_paid", "overdue"],
            },
          },
        ],
      },
    });

    for (const invoice of result.docs as unknown as Record<string, unknown>[]) {
      if (typeof invoice.id !== "number") {
        skipped += 1;
        continue;
      }

      const paystackData = invoice.paystack as Record<string, unknown> | undefined;
      const paymentRequestID =
        typeof paystackData?.paymentRequestID === "number"
          ? paystackData.paymentRequestID
          : undefined;

      if (!paymentRequestID) {
        skipped += 1;
        continue;
      }

      try {
        const previousStatus = invoice.status;
        const previousBalanceDue = invoice.balanceDue;
        const nextInvoice = await verifyInvoiceStatus({
          invoice,
          invoiceID: invoice.id,
          req,
        });

        verified += 1;

        if (
          nextInvoice.status !== previousStatus ||
          nextInvoice.balanceDue !== previousBalanceDue
        ) {
          updated += 1;
        }
      } catch {
        failed += 1;
      }
    }

    if (page >= result.totalPages) {
      break;
    }

    page += 1;
  }

  return {
    failed,
    skipped,
    updated,
    verified,
  };
};

const getWebhookInvoiceWhere = (event: Record<string, unknown>) => {
  const data = event.data;
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const payloadData = data as any;
  if (typeof payloadData.id === "number") {
    return {
      "paystack.paymentRequestID": {
        equals: payloadData.id,
      },
    } as any;
  }

  if (typeof payloadData.request_code === "string") {
    return {
      "paystack.requestCode": {
        equals: payloadData.request_code,
      },
    } as any;
  }

  return undefined;
};

export const verifyPaystackWebhookSignature = ({
  body,
  secretKey,
  signature,
}: {
  body: string;
  secretKey: string;
  signature: string;
}) => {
  const expected = createHmac("sha512", secretKey).update(body).digest("hex");

  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "";
};

const isDuplicateKeyError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("duplicate") || message.includes("unique") || message.includes("constraint")
  );
};

const derivePaystackWebhookEventKey = (event: Record<string, unknown>) => {
  const name = typeof event.event === "string" ? event.event : "unknown";
  const data = event.data;

  if (!data || typeof data !== "object") {
    return `${name}:unknown`;
  }

  const payloadData = data as any;

  const segments = [
    typeof payloadData.id === "number" ? String(payloadData.id) : undefined,
    typeof payloadData.request_code === "string" ? payloadData.request_code : undefined,
    typeof payloadData.status === "string" ? payloadData.status : undefined,
    typeof payloadData.paid === "boolean" ? String(payloadData.paid) : undefined,
  ].filter(Boolean);

  return `${name}:${segments.join(":") || "unknown"}`;
};

const reserveWebhookEvent = async ({
  event,
  payload,
  req,
}: {
  event: Record<string, unknown>;
  payload: Payload;
  req: PayloadRequest;
}) => {
  const eventKey = derivePaystackWebhookEventKey(event);

  try {
    return await payload.create({
      collection: CRM_WEBHOOK_EVENTS_COLLECTION,
      data: {
        eventKey,
        payload: JSON.stringify(event),
        provider: "paystack",
        receivedAt: new Date().toISOString(),
      },
      overrideAccess: true,
      req,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return null;
    }

    throw error;
  }
};

const releaseWebhookEventReservation = async ({
  eventID,
  payload,
  req,
}: {
  eventID: number;
  payload: Payload;
  req: PayloadRequest;
}) => {
  await payload.delete({
    collection: CRM_WEBHOOK_EVENTS_COLLECTION,
    id: eventID,
    overrideAccess: true,
    req,
  });
};

export const processPaystackInvoiceWebhook = async ({
  event,
  payload,
  req,
  verifyInvoiceStatus = verifyInvoicePaystackStatusByID,
}: {
  event: Record<string, unknown>;
  payload: Payload;
  req: PayloadRequest;
  verifyInvoiceStatus?: typeof verifyInvoicePaystackStatusByID;
}) => {
  const reservation = await reserveWebhookEvent({
    event,
    payload,
    req,
  });

  if (!reservation) {
    return {
      ignored: true,
      reason: "duplicate_event",
    };
  }

  const eventName = typeof event.event === "string" ? event.event : undefined;
  if (!eventName?.startsWith("paymentrequest.")) {
    return {
      ignored: true,
      reason: "unsupported_event",
    };
  }

  try {
    const where = getWebhookInvoiceWhere(event);
    if (!where) {
      return {
        ignored: true,
        reason: "missing_invoice_reference",
      };
    }

    const invoiceResult = await payload.find({
      collection: CRM_INVOICES_COLLECTION,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where,
    });

    const invoice = invoiceResult.docs[0] as unknown as Record<string, unknown> | undefined;
    if (typeof invoice?.id !== "number") {
      return {
        ignored: true,
        reason: "invoice_not_found",
      };
    }

    const updatedInvoice = await verifyInvoiceStatus({
      invoice,
      invoiceID: invoice.id,
      req,
    });

    return {
      ignored: false,
      invoiceID: invoice.id,
      status: updatedInvoice.status,
    };
  } catch (error) {
    await releaseWebhookEventReservation({
      eventID: reservation.id,
      payload,
      req,
    });

    throw error;
  }
};
