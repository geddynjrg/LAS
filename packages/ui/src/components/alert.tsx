import {
  IconAlertHexagonFilled,
  IconAlertTriangleFilled,
  IconCheck,
  IconInfoCircleFilled,
  IconX,
} from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export type AlertVariantType = "info" | "success" | "warning" | "error";
export type AlertPositionType = "local" | "floating" | "global";

export interface AlertProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  hasIcon?: boolean;
  variant?: AlertVariantType;
  position?: AlertPositionType;
  onClose?: () => void;
}

export const Alert: FC<AlertProps> = ({
  children,
  className,
  title,
  hasIcon = true,
  variant = "info",
  position = "local",
  onClose,
}) => {
  return (
    <div
      style={{
        borderColor: `${handleVariant(variant).textColor}`,
        background: handleVariant(variant).background,
      }}
      className={cn(
        `relative flex flex-col gap-2 border-solid p-4`,
        (position === "local" || position === "floating") &&
          "rounded-sm border",
        position === "floating" && "shadow-[0px_4px_10px_0px_rgba(0,0,0,0.1)]",
        position === "global" && "border-b",
        className,
      )}
    >
      {onClose && (
        <Button
          variant="neutral"
          className="absolute right-0 top-0 h-6 max-w-6"
          onClick={onClose}
        >
          <IconX color="var(--color-neutral-600)" />
        </Button>
      )}

      {title && (
        <div
          style={{
            color: handleVariant(variant).textColor,
          }}
          className="flex items-center gap-2"
        >
          {hasIcon && handleVariant(variant).icon}

          <h5 className="typo-h5">{title}</h5>
        </div>
      )}

      <p
        style={{ color: handleVariant(variant).textColor }}
        className="typo-body-small"
      >
        {children}
      </p>
    </div>
  );
};

function handleVariant(variant: AlertVariantType) {
  switch (variant) {
    case "info":
      return {
        icon: <IconInfoCircleFilled />,
        textColor: "var(--color-blue-500)",
        background: "var(--color-blue-100)",
      };
    case "success":
      return {
        icon: <IconCheck />,
        textColor: "var(--color-green-500)",
        background: "var(--color-green-100)",
      };
    case "warning":
      return {
        icon: <IconAlertTriangleFilled />,
        textColor: "var(--color-yellow-500)",
        background: "var(--color-yellow-100)",
      };
    case "error":
      return {
        icon: <IconAlertHexagonFilled />,
        textColor: "var(--color-red-500)",
        background: "var(--color-red-100)",
      };
  }
}
