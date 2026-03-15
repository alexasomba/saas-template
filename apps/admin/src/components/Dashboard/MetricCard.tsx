import React from "react";
import "./MetricCard.scss";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  loading?: boolean;
}

const baseClass = "dashboard-metric-card";

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, loading }) => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <span className={`${baseClass}__title`}>{title}</span>
        {icon && <div className={`${baseClass}__icon`}>{icon}</div>}
      </div>
      <div className={`${baseClass}__content`}>
        {loading ? (
          <div className={`${baseClass}__skeleton`} />
        ) : (
          <>
            <h3 className={`${baseClass}__value`}>{value}</h3>
            {trend && (
              <div
                className={`${baseClass}__trend ${
                  trend.isPositive
                    ? `${baseClass}__trend--positive`
                    : `${baseClass}__trend--negative`
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
