export const dashboardWidgets = [
  {
    slug: "analytics-summary",
    label: "Analytics Summary",
    Component: "@/components/Dashboard/AnalyticsWidget#AnalyticsWidget",
  },
  {
    slug: "recent-orders",
    label: "Recent Orders",
    Component: "@/components/Dashboard/OrdersWidget#OrdersWidget",
  },
  {
    slug: "products-inventory",
    label: "Products and Inventory",
    Component: "@/components/Dashboard/ProductsWidget#ProductsWidget",
  },
  {
    slug: "revenue-chart",
    label: "Revenue Chart",
    Component: "@/components/Dashboard/RevenueChart#RevenueChart",
  },
  {
    slug: "recent-customers",
    label: "Recent Customers",
    Component: "@/components/Dashboard/CustomersWidget#CustomersWidget",
  },
  {
    slug: "paystack-status",
    label: "Paystack Status",
    Component: "@/components/Dashboard/PaystackWidget#PaystackWidget",
  },
  {
    slug: "quick-actions",
    label: "Quick Actions",
    Component: "@/components/Dashboard/QuickActions#QuickActions",
  },
  {
    slug: "payload-jobs",
    label: "Background Jobs",
    Component: "@/components/Dashboard/JobsWidget#JobsWidget",
  },
] as const;

export const defaultDashboardLayout = [
  {
    widgetSlug: "analytics-summary",
    width: "full",
  },
  {
    widgetSlug: "payload-jobs",
    width: "half",
  },
  {
    widgetSlug: "quick-actions",
    width: "half",
  },
  {
    widgetSlug: "recent-orders",
    width: "half",
  },
  {
    widgetSlug: "products-inventory",
    width: "half",
  },
  {
    widgetSlug: "revenue-chart",
    width: "half",
  },
  {
    widgetSlug: "recent-customers",
    width: "half",
  },
  {
    widgetSlug: "paystack-status",
    width: "half",
  },
] as const;
