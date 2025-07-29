import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function StatCard({
  title,
  value,
  icon,
  subtitle,
  variant = "default",
}: StatCardProps) {
  const iconColorClasses = {
    default: "text-gray-600 bg-gray-100",
    success: "text-green-600 bg-green-100",
    warning: "text-amber-600 bg-amber-100",
    danger: "text-red-600 bg-red-100",
    info: "text-blue-600 bg-blue-100",
  };

  const valueColorClasses = {
    default: "text-gray-900",
    success: "text-gray-900",
    warning: "text-gray-900",
    danger: "text-gray-900",
    info: "text-gray-900",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {title}
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${valueColorClasses[variant]}`}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-gray-600">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`rounded-lg p-2 ${iconColorClasses[variant]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
