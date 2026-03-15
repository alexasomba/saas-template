import React from "react";
import { getPayload } from "payload";
import configPromise from "@/payload.config";
import { CreditCard, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export const PaystackWidget: React.FC = async () => {
  const payload = await getPayload({ config: configPromise });

  const transactions = await payload.find({
    collection: "transactions",
    sort: "-createdAt",
    limit: 5,
  });

  return (
    <div className="dashboard-widget">
      <div className="dashboard-widget__header">
        <h3 className="dashboard-widget__title">Paystack Status</h3>
        <CreditCard size={20} style={{ color: "var(--theme-elevation-400)" }} />
      </div>
      <div className="dashboard-widget__content">
        {transactions.docs.length === 0 ? (
          <div className="dashboard-widget__empty">No transactions yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {transactions.docs.map((tx) => {
              const txRecord = tx as unknown as Record<string, unknown>;
              const payloadValue = txRecord.payload;
              const info =
                typeof payloadValue === "object" && payloadValue !== null ? payloadValue : null;
              const status =
                (info &&
                "status" in info &&
                typeof info.status === "string" &&
                info.status.length > 0
                  ? info.status
                  : null) || (tx.amount ? "success" : "pending");

              return (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px",
                    borderLeft: `3px solid ${status === "success" ? "#10b981" : status === "failed" ? "#ef4444" : "#6b7280"}`,
                    background: "var(--theme-elevation-100)",
                    borderRadius: "0 4px 4px 0",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                      {tx.currency} {(tx.amount || 0) / 100}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--theme-elevation-500)" }}>
                      {status === "success"
                        ? "Successful"
                        : status === "failed"
                          ? "Failed"
                          : "Pending"}{" "}
                      • {format(new Date(tx.createdAt), "HH:mm")}
                    </div>
                  </div>
                  {status === "success" ? (
                    <CheckCircle2 size={16} color="#10b981" />
                  ) : status === "failed" ? (
                    <XCircle size={16} color="#ef4444" />
                  ) : (
                    <Clock size={16} color="#6b7280" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
