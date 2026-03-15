"use client";

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@payloadcms/ui";

type WorkflowActionProps = {
  id?: number | string;
};

type ActionButtonProps = {
  action: () => Promise<void>;
  disabled?: boolean;
  label: string;
  tone?: "default" | "muted";
};

type EndpointActionArgs = {
  body?: Record<string, unknown>;
  endpoint: string;
  onSuccess?: (data: Record<string, unknown>) => void;
  successMessage: string;
};

const formatSequence = (prefix: string, id: string | number) => {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");

  return `${prefix}-${date}-${String(id)}`;
};

const getAdminBasePath = () => {
  if (typeof window === "undefined") {
    return "/admin";
  }

  const collectionsIndex = window.location.pathname.indexOf("/collections/");
  if (collectionsIndex === -1) {
    return "/admin";
  }

  return window.location.pathname.slice(0, collectionsIndex);
};

const redirectToCollectionDocument = (collection: string, id: number | string) => {
  window.location.assign(`${getAdminBasePath()}/collections/${collection}/${id}`);
};

const ActionButton = ({ action, disabled, label, tone = "default" }: ActionButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading || disabled) {
      return;
    }

    setLoading(true);

    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The CRM action failed.");
    } finally {
      setLoading(false);
    }
  }, [action, disabled, loading]);

  return (
    <button
      className={`crm-workflow-actions__button crm-workflow-actions__button--${tone}`}
      disabled={disabled || loading}
      onClick={handleClick}
      type="button"
    >
      {loading ? "Working..." : label}
    </button>
  );
};

const WorkflowActionGroup = ({
  actions,
  title,
}: {
  actions: ActionButtonProps[];
  title: string;
}) => {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="crm-workflow-actions">
      <span className="crm-workflow-actions__title">{title}</span>
      <div className="crm-workflow-actions__row">
        {actions.map((action) => (
          <ActionButton key={action.label} {...action} />
        ))}
      </div>
    </div>
  );
};

const executeEndpointAction = async ({
  body,
  endpoint,
  onSuccess,
  successMessage,
}: EndpointActionArgs) => {
  const response = await fetch(endpoint, {
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof data.error === "string" ? data.error : "The CRM action failed.";
    throw new Error(message);
  }

  toast.success(successMessage);
  onSuccess?.(data);
};

const useDocumentID = (id?: number | string) =>
  useMemo(() => {
    if (typeof id === "number" && Number.isInteger(id)) {
      return id;
    }

    if (typeof id === "string" && /^\d+$/.test(id)) {
      return Number.parseInt(id, 10);
    }

    return undefined;
  }, [id]);

export const DealWorkflowActions = ({ id }: WorkflowActionProps) => {
  const documentID = useDocumentID(id);

  return (
    <WorkflowActionGroup
      title="CRM Actions"
      actions={[
        {
          action: async () => {
            if (!documentID) return;

            await executeEndpointAction({
              body: {
                dealID: documentID,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                quoteNumber: formatSequence("QT", documentID),
              },
              endpoint: "/api/crm/quotes/from-deal",
              onSuccess: (data) => {
                if (data.id) {
                  redirectToCollectionDocument("crm-quotes", String(data.id));
                }
              },
              successMessage: "Quote created from deal.",
            });
          },
          disabled: !documentID,
          label: "Create Quote",
        },
      ]}
    />
  );
};

export const QuoteWorkflowActions = ({ id }: WorkflowActionProps) => {
  const documentID = useDocumentID(id);

  return (
    <WorkflowActionGroup
      title="CRM Actions"
      actions={[
        {
          action: async () => {
            if (!documentID) return;

            await executeEndpointAction({
              body: {
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                invoiceNumber: formatSequence("INV", documentID),
                quoteID: documentID,
              },
              endpoint: "/api/crm/invoices/from-quote",
              onSuccess: (data) => {
                if (data.id) {
                  redirectToCollectionDocument("crm-invoices", String(data.id));
                }
              },
              successMessage: "Invoice created from quote.",
            });
          },
          disabled: !documentID,
          label: "Create Invoice",
        },
      ]}
    />
  );
};

export const OrderWorkflowActions = ({ id }: WorkflowActionProps) => {
  const documentID = useDocumentID(id);

  return (
    <WorkflowActionGroup
      title="CRM Actions"
      actions={[
        {
          action: async () => {
            if (!documentID) return;

            await executeEndpointAction({
              body: {
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                invoiceNumber: formatSequence("INV", documentID),
                orderID: documentID,
              },
              endpoint: "/api/crm/invoices/from-order",
              onSuccess: (data) => {
                if (data.id) {
                  redirectToCollectionDocument("crm-invoices", String(data.id));
                }
              },
              successMessage: "Invoice created from order.",
            });
          },
          disabled: !documentID,
          label: "Create Invoice",
        },
      ]}
    />
  );
};

export const InvoiceWorkflowActions = ({ id }: WorkflowActionProps) => {
  const documentID = useDocumentID(id);

  return (
    <WorkflowActionGroup
      title="CRM Actions"
      actions={[
        {
          action: async () => {
            if (!documentID) return;

            await executeEndpointAction({
              body: {
                invoiceID: documentID,
              },
              endpoint: "/api/crm/invoices/paystack/sync",
              successMessage: "Paystack invoice synced.",
            });
          },
          disabled: !documentID,
          label: "Sync Paystack",
        },
        {
          action: async () => {
            if (!documentID) return;

            await executeEndpointAction({
              body: {
                invoiceID: documentID,
              },
              endpoint: "/api/crm/invoices/paystack/verify",
              successMessage: "Paystack invoice verified.",
            });
          },
          disabled: !documentID,
          label: "Verify Payment",
          tone: "muted",
        },
      ]}
    />
  );
};
