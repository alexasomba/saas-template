import React from "react";
import { getPayload } from "payload";
import configPromise from "@/payload.config";
import { subDays, format, startOfDay } from "date-fns";
import { DEFAULT_CURRENCY, currenciesConfig } from "@/config/currencies";
import "./Widgets.scss";

export const RevenueChart: React.FC = async () => {
  const payload = await getPayload({ config: configPromise });
  const days = 7;
  const startDate = subDays(new Date(), days - 1);

  const defaultCurrencyConfig =
    currenciesConfig.supportedCurrencies.find((c) => c.code === DEFAULT_CURRENCY) ||
    currenciesConfig.supportedCurrencies[0];
  const symbol = defaultCurrencyConfig.symbol;

  const orders = await payload.find({
    collection: "orders",
    where: {
      status: { equals: "completed" },
      createdAt: { greater_than_equal: startOfDay(startDate).toISOString() },
    },
    limit: 1000,
  });

  // Aggregate by day
  const dailyRevenue = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    dailyRevenue.set(date, 0);
  }

  orders.docs.forEach((order) => {
    const date = format(new Date(order.createdAt), "yyyy-MM-dd");
    if (dailyRevenue.has(date)) {
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + (order.amount || 0));
    }
  });

  const data = Array.from(dailyRevenue.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({
      label: format(new Date(date), "MMM dd"),
      value: amount / 100, // Convert to dollars
    }));

  const maxVal = Math.max(...data.map((d) => d.value), 100);
  const chartHeight = 120;
  const chartWidth = 400;
  const padding = 20;

  // Simple SVG Line Chart calculation
  const points = data
    .map((d, i) => {
      const x = (i / (days - 1)) * (chartWidth - padding * 2) + padding;
      const y = chartHeight - (d.value / maxVal) * (chartHeight - padding * 2) - padding;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="dashboard-widget widget-span-2">
      <div className="dashboard-widget__header">
        <div>
          <h3 className="dashboard-widget__title">Revenue Chart</h3>
          <p
            style={{
              color: "var(--theme-elevation-500)",
              fontSize: "0.75rem",
              marginTop: "0.25rem",
            }}
          >
            Last {days} days of completed-order revenue
          </p>
        </div>
      </div>
      <div className="dashboard-widget__content">
        <div style={{ position: "relative", width: "100%", height: chartHeight }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: "100%", height: "100%" }}
          >
            {/* Grid lines */}
            <line
              x1={padding}
              y1={chartHeight - padding}
              x2={chartWidth - padding}
              y2={chartHeight - padding}
              stroke="var(--theme-elevation-200)"
            />

            {/* The Line */}
            <polyline
              fill="none"
              stroke="var(--theme-primary-500)"
              strokeWidth="2"
              points={points}
            />

            {/* Data points */}
            {data.map((d, i) => {
              const x = (i / (days - 1)) * (chartWidth - padding * 2) + padding;
              const y = chartHeight - (d.value / maxVal) * (chartHeight - padding * 2) - padding;
              return <circle key={i} cx={x} cy={y} r="3" fill="var(--theme-primary-500)" />;
            })}
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          {data.map((d, i) => (
            <div
              key={i}
              style={{
                fontSize: "0.65rem",
                color: "var(--theme-elevation-400)",
                textAlign: "center",
              }}
            >
              {d.label}
              <div style={{ fontWeight: 600, color: "var(--theme-elevation-700)" }}>
                {symbol}
                {Math.round(d.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
