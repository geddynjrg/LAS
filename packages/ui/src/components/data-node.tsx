import type { FC, ReactNode } from "react";

export interface DataNodeProps {
  label: string;
  children?: ReactNode;
}

export const DataNode: FC<DataNodeProps> = ({ children, label }) => (
  <div>
    <div className="font-bold">{label}</div>
    {children}
  </div>
);
