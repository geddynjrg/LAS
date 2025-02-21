import {
  IconAlertHexagonFilled,
  IconAlertTriangleFilled,
  IconCheck,
  IconInfoCircleFilled,
  IconX,
} from "@tabler/icons-react";
import { cva, type VariantProps } from "cva-extended";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export const alertVariants = cva({
  base: "relative flex flex-col gap-2 border-solid p-4",
  variants: {
    variant: {
      info: "border-blue-500 bg-blue-100 text-blue-500",
      success: "border-green-500 bg-green-100 text-green-500",
      warning: "border-yellow-500 bg-yellow-100 text-yellow-500",
      error: "border-red-500 bg-red-100 text-red-500",
    },
    position: {
      local: "rounded-sm border",
      global: "border-b",
      floating: "rounded-sm border shadow-[0px_4px_10px_0px_rgba(0,0,0,0.1)]",
    },
  },
  defaultVariants: {
    variant: "info",
    position: "local",
  },
});

export interface AlertProps extends VariantProps<typeof alertVariants> {
  children?: ReactNode;
  className?: string;
  title?: string;
  hasIcon?: boolean;
  onClose?: () => void;
}

export const Alert: FC<AlertProps> = ({
  children,
  className,
  title,
  hasIcon = true,
  variant,
  position,
  onClose,
}) => {
  return (
    <div className={cn(alertVariants({ variant, position }), className)}>
      {onClose && (
        <Button
          variant="neutral"
          className="absolute right-0 top-0 h-6 max-w-6"
          onClick={onClose}
        >
          <IconX className="text-neutral-600" />
        </Button>
      )}

      {title && (
        <div className="flex items-center gap-2">
          {hasIcon && getIcon(variant)}

          <h5 className="typo-h5">{title}</h5>
        </div>
      )}

      <div className="typo-body-small text-left">{children}</div>
    </div>
  );
};

function getIcon(variant: VariantProps<typeof alertVariants>["variant"]) {
  switch (variant) {
    case "info":
      return <IconInfoCircleFilled />;

    case "success":
      return <IconCheck />;

    case "warning":
      return <IconAlertTriangleFilled />;

    case "error":
      return <IconAlertHexagonFilled />;
  }
}
