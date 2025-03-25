import { getTranslations } from "next-intl/server";
import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

import type { Status } from "@/lib/data/application";

export const ApplicationStatus: FC<{ status: Status }> = ({ status }) => {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "mt-1 h-4 min-h-4 w-4 min-w-4 rounded-full",
          (status === "IN_REVIEW" || status === "PENDING") && "bg-green-400",
          status === "UNSUBMITTED" && "bg-yellow-400",
        )}
      ></div>
      <span className="text-[21px] leading-[27px]">
        <StatusText status={status} />
      </span>
    </div>
  );
};

const StatusText: FC<{ status: Status }> = async ({ status }) => {
  const t = await getTranslations("DashboardPage");

  const strongText = (chunk: ReactNode) => <strong>{chunk}</strong>;

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
