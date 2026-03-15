import React from "react";
import { getPayload } from "payload";
import configPromise from "@/payload.config";
import { format } from "date-fns";
import { Users, UserPlus } from "lucide-react";

export const CustomersWidget: React.FC = async () => {
  const payload = await getPayload({ config: configPromise });

  const recentCustomers = await payload.find({
    collection: "users",
    where: {
      roles: { contains: "customer" },
    },
    sort: "-createdAt",
    limit: 5,
  });

  return (
    <div className="dashboard-widget">
      <div className="dashboard-widget__header">
        <h3 className="dashboard-widget__title">Recent Customers</h3>
        <Users size={20} style={{ color: "var(--theme-elevation-400)" }} />
      </div>
      <div className="dashboard-widget__content">
        {recentCustomers.docs.length === 0 ? (
          <div className="dashboard-widget__empty">No customers yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentCustomers.docs.map((customer) => (
              <div
                key={customer.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px",
                  borderRadius: "4px",
                  background: "var(--theme-elevation-100)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--theme-elevation-200)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--theme-elevation-600)",
                  }}
                >
                  <UserPlus size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {customer.email}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--theme-elevation-400)" }}>
                    Joined {format(new Date(customer.createdAt), "MMM dd")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
