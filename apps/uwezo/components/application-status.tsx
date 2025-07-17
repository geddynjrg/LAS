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
      case "UNSUBMITTED":
        return t.rich("status.unsubmitted", {
          bold: strongText,
        });
      case "DRAFT":
        return t.rich("status.draft", {
          bold: strongText,
        });
      case "SUBMITTED":
        return t.rich("status.submitted", {
          bold: strongText,
        });
      case "PENDING":
        return t.rich("status.pending", {
          bold: strongText,
        });
      case "IN_REVIEW":
        return t.rich("status.inReview", {
          bold: strongText,
        });
      case "APPROVED":
        return t.rich("status.approved", {
          bold: strongText,
        });
      case "REJECTED":
        return t.rich("status.rejected", {
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
          status === "UNSUBMITTED" && "bg-gray-400",
          status === "DRAFT" && "bg-yellow-400",
          status === "SUBMITTED" && "bg-blue-400",
          (status === "IN_REVIEW" || status === "PENDING") && "bg-green-400",
          status === "APPROVED" && "bg-green-600",
          status === "REJECTED" && "bg-red-500",
        )}
      ></div>
      <span className="text-[21px] leading-[27px]">{getStatusText()}</span>
    </div>
  );
};
