import type { FC, ReactNode } from "react";

import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const dataNodeVariants = cva({
  variants: {
    variant: {
      default: "text-foreground",
      highlighted: "text-yellow-500",
      disabled: "text-neutral-600",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface DataNodeProps extends VariantProps<typeof dataNodeVariants> {
  label: string;
  children?: ReactNode;
}

export const DataNode: FC<DataNodeProps> = ({ children, label, variant }) => (
  <div className={cn(dataNodeVariants({ variant }))}>
    <div className="font-bold">{label}</div>
    {children}
  </div>
);
