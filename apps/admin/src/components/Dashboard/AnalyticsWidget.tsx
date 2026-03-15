import React from "react";
import { getPayload } from "payload";
import configPromise from "@/payload.config";
import { MetricCard } from "./MetricCard";
import { ShoppingBag, DollarSign, Users, AlertTriangle } from "lucide-react";
import { DEFAULT_CURRENCY } from "@/config/currencies";
import "./AnalyticsWidget.scss";

export const AnalyticsWidget: React.FC = async () => {
  const payload = await getPayload({ config: configPromise });

  // Fetch metrics in parallel
  const [orders, customers, lowStockProducts] = await Promise.all([
    payload.find({
      collection: "orders",
      where: {
        or: [{ status: { equals: "completed" } }, { status: { equals: "processing" } }],
      },
      limit: 0,
    }),
    payload.find({
      collection: "users",
      where: {
        roles: { contains: "customer" },
      },
      limit: 0,
    }),
    payload.find({
      collection: "products",
      where: {
        inventory: { less_than: 10 },
      },
      limit: 0,
    }),
  ]);

  // Group revenue by currency to support multi-currency shops correctly
  const revenueByCurrency = orders.docs.reduce(
    (acc, order) => {
      // Determine currency, fallback to default config currency if missing on old orders
      const currency = order.currency || DEFAULT_CURRENCY;
      acc[currency] = (acc[currency] || 0) + (order.amount || 0);
      return acc;
    },
    {} as Record<string, number>,
  );

  // Format each currency
  const formattedRevenues = Object.entries(revenueByCurrency).map(([currency, amount]) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  });

  // If no orders, show $0 or equivalent in default context
  const formattedRevenue =
    formattedRevenues.length > 0
      ? formattedRevenues.join(" + ")
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: DEFAULT_CURRENCY,
        }).format(0);

  return (
    <div className="analytics-widget-grid">
      <MetricCard
        title="Total Revenue"
        value={formattedRevenue}
        icon={<DollarSign size={20} />}
        trend={{ value: "12%", isPositive: true }}
      />
      <MetricCard title="Total Orders" value={orders.totalDocs} icon={<ShoppingBag size={20} />} />
      <MetricCard title="Active Customers" value={customers.totalDocs} icon={<Users size={20} />} />
      <MetricCard
        title="Low Stock"
        value={lowStockProducts.totalDocs}
        icon={<AlertTriangle size={20} />}
        trend={{
          value: lowStockProducts.totalDocs > 5 ? "High" : "Low",
          isPositive: lowStockProducts.totalDocs < 5,
        }}
      />
    </div>
  );
};
