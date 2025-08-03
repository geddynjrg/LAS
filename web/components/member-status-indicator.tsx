import { IconClock, IconUserCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";

interface MemberStatusIndicatorProps {
  status: string;
  variant?: "badge" | "icon" | "full";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const MemberStatusIndicator: FC<MemberStatusIndicatorProps> = ({
  status,
  variant = "full",
  size = "md",
  className = "",
}) => {
  const t = useTranslations("DashboardPage");
  const isConfirmed = status === "confirmed";

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  const getStatusIcon = () => {
    if (isConfirmed) {
      return <IconUserCheck className={cn(iconSize, "text-green-600")} />;
    }
    return <IconClock className={cn(iconSize, "text-amber-600")} />;
  };

  const getStatusBadge = () => {
    if (isConfirmed) {
      return (
        <Badge
          variant="success"
          className={cn("text-xs", {
            "px-1.5 py-0.5 text-[10px]": size === "sm",
            "text-xs": size === "md",
            "text-sm": size === "lg",
          })}
        >
          {t("memberStatus.confirmedLabel")}
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className={cn("text-xs", {
          "px-1.5 py-0.5 text-[10px]": size === "sm",
          "text-xs": size === "md",
          "text-sm": size === "lg",
        })}
      >
        {t("memberStatus.pendingLabel")}
      </Badge>
    );
  };

  const getStatusText = () => {
    return isConfirmed
      ? t("memberStatus.confirmedLabel")
      : t("memberStatus.pendingLabel");
  };

  if (variant === "icon") {
    return (
      <div className={cn("flex items-center", className)}>
        {getStatusIcon()}
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div className={cn("flex items-center", className)}>
        {getStatusBadge()}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {getStatusIcon()}
      <span
        className={cn("text-neutral-700", {
          "text-xs": size === "sm",
          "text-sm": size === "md",
          "text-base": size === "lg",
        })}
      >
        {getStatusText()}
      </span>
    </div>
  );
};

export type { MemberStatusIndicatorProps };
