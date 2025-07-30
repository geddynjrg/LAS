import { ReactNode } from "react";

interface TableBadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function TableBadge({
  children,
  variant = "default",
  className = "",
}: TableBadgeProps) {
  const variantClasses = {
    default: "bg-gray-50 text-gray-700 border-gray-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  icon,
}: {
  status: string;
  icon?: ReactNode;
}) {
  const getStatusConfig = (status: string) => {
    const statusConfigs: Record<
      string,
      { variant: TableBadgeProps["variant"]; label: string }
    > = {
      // Application statuses
      UNSUBMITTED: { variant: "default", label: "Not Started" },
      DRAFT: { variant: "warning", label: "Draft" },
      SUBMITTED: { variant: "info", label: "Submitted" },
      PENDING: { variant: "warning", label: "Pending" },
      IN_REVIEW: { variant: "info", label: "In Review" },
      APPROVED: { variant: "success", label: "Approved" },
      REJECTED: { variant: "danger", label: "Rejected" },
      DISBURSED: { variant: "success", label: "Disbursed" },
      CLOSED: { variant: "default", label: "Closed" },

      // Sync statuses
      IN_PROGRESS: { variant: "info", label: "In Progress" },
      COMPLETED: { variant: "success", label: "Completed" },
      FAILED: { variant: "danger", label: "Failed" },

      // Queue statuses
      PROCESSING: { variant: "info", label: "Processing" },

      // Confirmation statuses
      confirmed: { variant: "success", label: "Confirmed" },
      declined: { variant: "danger", label: "Declined" },
      pending: { variant: "warning", label: "Pending" },
    };

    return (
      statusConfigs[status] || { variant: "default" as const, label: status }
    );
  };

  const config = getStatusConfig(status);

  return (
    <TableBadge variant={config.variant}>
      {icon}
      {config.label}
    </TableBadge>
  );
}

export function ActionBadge({ action }: { action: string }) {
  const getActionConfig = (action: string) => {
    const actionConfigs: Record<
      string,
      { variant: TableBadgeProps["variant"]; label: string }
    > = {
      CREATE: { variant: "info", label: "Create" },
      UPDATE: { variant: "warning", label: "Update" },
      DELETE: { variant: "danger", label: "Delete" },
    };

    return (
      actionConfigs[action] || { variant: "default" as const, label: action }
    );
  };

  const config = getActionConfig(action);

  return <TableBadge variant={config.variant}>{config.label}</TableBadge>;
}
