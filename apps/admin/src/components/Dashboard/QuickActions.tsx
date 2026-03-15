import React from "react";
import Link from "next/link";
import { PlusCircle, Tag, ShoppingCart, Settings } from "lucide-react";

export const QuickActions: React.FC = () => {
  const actions = [
    {
      label: "New Product",
      href: "/admin/collections/products/create",
      icon: <PlusCircle size={18} />,
    },
    { label: "Create Discount", href: "/admin/collections/forms/create", icon: <Tag size={18} /> },
    { label: "View Orders", href: "/admin/collections/orders", icon: <ShoppingCart size={18} /> },
    { label: "Store Settings", href: "/admin/globals/header", icon: <Settings size={18} /> },
  ];

  return (
    <div className="dashboard-widget">
      <div className="dashboard-widget__header">
        <h3 className="dashboard-widget__title">Quick Actions</h3>
      </div>
      <div className="dashboard-widget__content">
        <div className="quick-actions">
          {actions.map((action) => (
            <Link key={action.label} href={action.href} className="action-btn">
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
