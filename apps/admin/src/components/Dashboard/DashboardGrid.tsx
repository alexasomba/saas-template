import React from "react";
import "./DashboardGrid.scss";

interface DashboardGridProps {
  children: React.ReactNode;
}

const baseClass = "dashboard-grid";

export const DashboardGrid: React.FC<DashboardGridProps> = ({ children }) => {
  return <div className={baseClass}>{children}</div>;
};
