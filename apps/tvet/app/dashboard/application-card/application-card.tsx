import { getTranslations } from "next-intl/server";
import { type FC } from "react";

import { Card } from "@workspace/ui/components/card";
import { DataNode } from "@workspace/ui/components/data-node";
import { DataPair } from "@workspace/ui/components/data-pair";
import { cn } from "@workspace/ui/lib/utils";

import { ApplicationCardActions } from "@/app/dashboard/application-card/application-card-actions";

export type ApplicationStatus =
  | "draft"
  | "in_progress"
  | "submitted"
  | "application_payment_pending"
  | "application_payment_received"
  | "reviewing"
  | "rejected"
  | "approved"
  | "course_payment_pending"
  | "course_payment_received"
  | "completed";

export type ApplicationPaymentStatus =
  | "unpaid"
  | "pending"
  | "proof_uploaded"
  | "paid"
  | "rejected";

enum CardType {
  success = "success",
  danger = "danger",
  warning = "warning",
}

export interface ApplicationCardProps {
  id?: number;
  application_id?: string;
  application_status?: ApplicationStatus;
  payment_status?: ApplicationPaymentStatus;
  institution?: string;
  course?: string;
  intake?: string;
  course_duration?: string;
  current_step?: string;
  className?: string;
  rejection_reason?: string;
  rejection_message?: string;
}

export const ApplicationCard: FC<ApplicationCardProps> = async (props) => {
  const t = await getTranslations("ApplicationCard");

  console.log(props);

  const type = getCardType(props);

  function getStatusText(application: ApplicationCardProps) {
    if (!application.application_status) {
      return "";
    }

    if (
      application.application_status === "submitted" &&
      application.payment_status
    ) {
      return t(`payment_status_${application.payment_status}`);
    }

    return t(`status_${application.application_status}`);
  }

  return (
    <Card
      className={cn(
        type === CardType.danger && "border-red-400",
        type === CardType.success && "border-primary",
        props.className,
      )}
      title={props.course || t("title")}
      caption={props.institution}
      statusLabel={getStatusText(props)}
      variant={type}
    >
      <div className="flex-1">
        <DataPair className={cn("justify-around")}>
          {props.intake && <DataNode label="Intake">{props.intake}</DataNode>}
          {props.course_duration && (
            <DataNode label="Duration">{props.course_duration}</DataNode>
          )}
        </DataPair>
      </div>

      <ApplicationCardActions {...props} />
    </Card>
  );
};

function getCardType(application: ApplicationCardProps) {
  switch (application.application_status) {
    case "approved":
      return CardType.success;
    case "rejected":
      return CardType.danger;
    default:
      return CardType.warning;
  }
}
