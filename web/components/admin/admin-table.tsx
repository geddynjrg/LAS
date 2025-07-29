import { ReactNode } from "react";

interface AdminTableProps {
  children: ReactNode;
  className?: string;
}

interface AdminTableHeaderProps {
  children: ReactNode;
}

interface AdminTableBodyProps {
  children: ReactNode;
}

interface AdminTableRowProps {
  children: ReactNode;
  className?: string;
}

interface AdminTableCellProps {
  children: ReactNode;
  className?: string;
  isHeader?: boolean;
}

export function AdminTable({ children, className = "" }: AdminTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </div>
  );
}

export function AdminTableHeader({ children }: AdminTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50">{children}</tr>
    </thead>
  );
}

export function AdminTableBody({ children }: AdminTableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-200 bg-white">{children}</tbody>
  );
}

export function AdminTableRow({
  children,
  className = "",
}: AdminTableRowProps) {
  return <tr className={`hover:bg-gray-50 ${className}`}>{children}</tr>;
}

export function AdminTableCell({
  children,
  className = "",
  isHeader = false,
}: AdminTableCellProps) {
  const baseClasses = isHeader
    ? "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
    : "px-4 py-3";

  return <td className={`${baseClasses} ${className}`}>{children}</td>;
}

export function AdminTableHeaderCell({
  children,
  className = "",
  onClick,
  sortable = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  sortable?: boolean;
}) {
  const cellClasses = `px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${
    sortable ? "cursor-pointer hover:text-gray-700" : ""
  } ${className}`;

  return (
    <th className={cellClasses} onClick={onClick}>
      {children}
    </th>
  );
}
