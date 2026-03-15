import React from "react";
import { getPayload } from "payload";
import configPromise from "@/payload.config";
import { format } from "date-fns";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import "./Widgets.scss";

export const OrdersWidget: React.FC = async () => {
  const payload = await getPayload({ config: configPromise });

  const recentOrders = await payload.find({
    collection: "orders",
    sort: "-createdAt",
    limit: 5,
  });

  return (
    <div className="dashboard-widget widget-span-2">
      <div className="dashboard-widget__header">
        <h3 className="dashboard-widget__title">Recent Orders</h3>
        <Link href="/admin/collections/orders" className="dashboard-widget__link">
          View All <ExternalLink size={14} />
        </Link>
      </div>
      <div className="dashboard-widget__content">
        {recentOrders.docs.length === 0 ? (
          <div className="dashboard-widget__empty">No orders found</div>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.docs.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/collections/orders/${order.id}`}>#{order.id}</Link>
                  </td>
                  <td>{order.customerEmail || "Guest"}</td>
                  <td>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: order.currency || "USD",
                    }).format((order.amount || 0) / 100)}
                  </td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>{order.status}</span>
                  </td>
                  <td>{format(new Date(order.createdAt), "MMM dd, HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
