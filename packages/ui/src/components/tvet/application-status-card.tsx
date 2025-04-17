import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { DataPair } from "@workspace/ui/components/data-pair";
import { cn } from "@workspace/ui/lib/utils";

export interface ApplicationStatusCardProps {
  id: string;
  application_id: string;
  application_status: string;
  payment_status: string;
  institution: string;
  course: string;
  created: string;
  changed: string;
}

enum CardType {
  success = "success",
  danger = "danger",
  warning = "warning",
}

export const ApplicationStatusCard: FC<ApplicationStatusCardProps> = (
  application,
) => {
  const t = useTranslations("ApplicationStatusCard");

  let type: CardType | null = null;

  switch (application.application_status) {
    case "accepted":
      type = CardType.success;
      break;
    case "rejected":
      type = CardType.danger;
      break;
    case "pending":
    case "draft":
    case "created":
    case "completed":
    case "reviewing":
    case "confirmed":
      type = CardType.warning;
      break;
    default:
      type = CardType.warning;
  }

  return (
    <Card
      className={cn(
        type === CardType.danger && "border-red-400",
        type === CardType.success && "border-primary",
      )}
      title={application.course}
      caption={application.institution}
      statusLabel={application.application_status}
      variant={type}
    >
      <DataPair className={cn("justify-around")}>
        {/* 
           <DataNode label="Intake">{application.intake}</DataNode>
            <DataNode label="Duration">{application.duration}</DataNode> 
          */}
      </DataPair>

      {type === CardType.danger && <Button>{t("viewRejectionReason")}</Button>}

      {type === CardType.success && <Button>{t("viewNextSteps")}</Button>}

      {type === CardType.warning && (
        <Button asChild>
          <Link href={`/apply/${application.application_id}/applicant`}>
            {t("viewApplication")}
          </Link>
        </Button>
      )}
    </Card>
  );
};
