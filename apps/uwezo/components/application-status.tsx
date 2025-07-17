"use client";

import { useTranslations } from "next-intl";
import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

import type { Status } from "@/lib/data/application";

export const ApplicationStatus: FC<{ status: Status }> = ({ status }) => {
  const t = useTranslations("DashboardPage");

  const strongText = (chunk: ReactNode) => <strong>{chunk}</strong>;

  const getStatusText = () => {
    switch (status) {
      case "PENDING":
        return t.rich("status.pending", {
          bold: strongText,
        });
      case "IN_REVIEW":
        return t.rich("status.inReview", {
          bold: strongText,
        });
      case "UNSUBMITTED":
        return t.rich("status.unsubmitted", {
          bold: strongText,
        });
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "mt-1 h-4 min-h-4 w-4 min-w-4 rounded-full",
          (status === "IN_REVIEW" || status === "PENDING") && "bg-green-400",
          status === "UNSUBMITTED" && "bg-yellow-400",
        )}
      ></div>
      <span className="text-[21px] leading-[27px]">{getStatusText()}</span>
    </div>
  );
};
