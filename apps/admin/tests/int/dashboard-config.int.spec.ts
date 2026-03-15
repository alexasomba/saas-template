import { describe, expect, it } from "vitest";

import { dashboardWidgets, defaultDashboardLayout } from "@/components/Dashboard/dashboardConfig";

describe("dashboard widget config", () => {
  it("registers the native dashboard widgets for admin analytics and ops cards", () => {
    expect(dashboardWidgets.map((widget) => widget.slug)).toEqual([
      "analytics-summary",
      "recent-orders",
      "products-inventory",
      "revenue-chart",
      "recent-customers",
      "paystack-status",
      "quick-actions",
      "payload-jobs",
    ]);
  });

  it("provides a default widget layout for the dashboard", () => {
    expect(defaultDashboardLayout).toEqual([
      { widgetSlug: "analytics-summary", width: "full" },
      { widgetSlug: "payload-jobs", width: "half" },
      { widgetSlug: "quick-actions", width: "half" },
      { widgetSlug: "recent-orders", width: "half" },
      { widgetSlug: "products-inventory", width: "half" },
      { widgetSlug: "revenue-chart", width: "half" },
      { widgetSlug: "recent-customers", width: "half" },
      { widgetSlug: "paystack-status", width: "half" },
    ]);
  });
});
