import React from "react";
import { getPayload } from "payload";
import configPromise from "@/payload.config";
import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import "./Widgets.scss";

export const ProductsWidget: React.FC = async () => {
  const payload = await getPayload({ config: configPromise });

  // Top selling products (simplified for now: just based on existence in orders)
  const orders = await payload.find({
    collection: "orders",
    limit: 100,
  });

  const productCounts = new Map<number, number>();
  orders.docs.forEach((order) => {
    order.items?.forEach((item) => {
      const productId =
        typeof item.product === "object" ? item.product?.id : (item.product as number);
      if (productId) {
        productCounts.set(productId, (productCounts.get(productId) || 0) + item.quantity);
      }
    });
  });

  const topProductIds = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topProducts = await Promise.all(
    topProductIds.map(async ([id, count]) => {
      const product = await payload.findByID({ collection: "products", id });
      return { ...product, count };
    }),
  );

  const lowStock = await payload.find({
    collection: "products",
    where: {
      inventory: { less_than: 10 },
    },
    limit: 5,
  });

  return (
    <div className="dashboard-widget widget-span-2">
      <div className="dashboard-widget__header">
        <h3 className="dashboard-widget__title">Products & Inventory</h3>
        <Link href="/admin/collections/products" className="dashboard-widget__link">
          Manage Inventory <ExternalLink size={14} />
        </Link>
      </div>
      <div className="dashboard-widget__content">
        <div style={{ marginBottom: "1.5rem" }}>
          <h4
            style={{
              fontSize: "0.85rem",
              color: "var(--theme-elevation-500)",
              marginBottom: "0.5rem",
            }}
          >
            Top Sellers
          </h4>
          {topProducts.length === 0 ? (
            <div className="dashboard-widget__empty">No sales data yet</div>
          ) : (
            <table className="dashboard-table">
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link href={`/admin/collections/products/${product.id}`}>
                        {product.title}
                      </Link>
                    </td>
                    <td style={{ textAlign: "right" }}>{product.count} sold</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h4
            style={{
              fontSize: "0.85rem",
              color: "var(--theme-elevation-500)",
              marginBottom: "0.5rem",
            }}
          >
            <AlertTriangle size={14} style={{ marginRight: "4px", verticalAlign: "text-bottom" }} />
            Stock Alerts
          </h4>
          {lowStock.docs.length === 0 ? (
            <div className="dashboard-widget__empty">All stock levels normal</div>
          ) : (
            <table className="dashboard-table">
              <tbody>
                {lowStock.docs.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link href={`/admin/collections/products/${product.id}`}>
                        {product.title}
                      </Link>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: (product.inventory || 0) === 0 ? "#ef4444" : "#f59e0b",
                      }}
                    >
                      {(product.inventory || 0) === 0
                        ? "Out of stock"
                        : `${product.inventory} left`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
