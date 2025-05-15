"use client";

import { IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FC, type ReactNode } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { DataNode } from "@workspace/ui/components/data-node";
import { DataPair } from "@workspace/ui/components/data-pair";
import { Divider } from "@workspace/ui/components/divider";
import { cn } from "@workspace/ui/lib/utils";

import { UploadPaymentProofForm } from "@/app/dashboard/application-card/upload-payment-proof-form";

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

export const ApplicationCard: FC<ApplicationCardProps> = (props) => {
  const t = useTranslations("ApplicationCard");
  const search = useSearchParams();

  const successUploadId = search.get("payment_proof_success");
  const isUploadSuccess = successUploadId === props.application_id;

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

      {isUploadSuccess && (
        <Alert variant="success" className="mb-4">
          {t("proofUploadSuccess")}
        </Alert>
      )}

      <ApplicationActions {...props} />
    </Card>
  );
};

const ApplicationActions: FC<ApplicationCardProps> = (props) => {
  const t = useTranslations("ApplicationCard");

  switch (props.application_status) {
    case "draft":
      return (
        <Button asChild>
          <Link
            href={`/apply/${props.application_id}/${props.current_step ?? "applicant"}`}
          >
            {t("edit")}
          </Link>
        </Button>
      );

    case "submitted":
      return (
        <PaymentActions
          {...props}
          paymentInfoLink={`/api/v1/application/${props.application_id}/payment-info-pdf`}
          type="application"
        />
      );

    case "approved":
      return (
        <PaymentActions
          {...props}
          paymentInfoLink={`/api/v1/application/${props.application_id}/course-payment-info-pdf`}
          type="course"
        />
      );

    case "rejected":
      return (
        <DescriptionActions
          label={t("viewRejectReason")}
          className="border-red-400 bg-red-200"
        >
          <p className="typo-h6">{props.rejection_reason}</p>
          {props.rejection_message}
        </DescriptionActions>
      );

    default:
      return (
        <DescriptionActions>
          TODO: Next steps description here
        </DescriptionActions>
      );
  }
};

const PaymentActions: FC<{
  application_id?: string;
  paymentInfoLink: string | undefined;
  type: "application" | "course";
}> = ({ application_id, paymentInfoLink, type }) => {
  const t = useTranslations("ApplicationCard");
  const tCommon = useTranslations("Common");
  const search = useSearchParams();
  const highlightedApplicationId = search.get("pay_later_id");

  const isHighlighted = highlightedApplicationId === application_id;
  const [isPaymentProofFormVisible, setIsPaymentProofFormVisible] =
    useState(isHighlighted);

  return (
    <>
      <Button className="w-full" asChild disabled>
        <Link href={`/apply/${application_id}/payment/mpesa`}>
          {t("pay", { method: "M-Pesa" })}
        </Link>
      </Button>

      <Divider>{tCommon("or")}</Divider>
      {isPaymentProofFormVisible ? (
        <UploadPaymentProofForm
          isHighlighted={isHighlighted}
          onClose={() => setIsPaymentProofFormVisible(false)}
          application_id={application_id || ""}
          paymentInfoLink={paymentInfoLink}
          type={type}
        />
      ) : (
        <Button
          className="w-full"
          onClick={() => setIsPaymentProofFormVisible(true)}
        >
          {t("uploadProof")}
        </Button>
      )}
    </>
  );
};

const DescriptionActions: FC<{
  label?: string;
  children: ReactNode;
  className?: string;
}> = ({ label, children, className }) => {
  const t = useTranslations("ApplicationCard");
  const [isDescriptionsVisible, setIsDescriptionsVisible] = useState(false);

  return (
    <>
      <Button
        className="w-full"
        onClick={() => setIsDescriptionsVisible((v) => !v)}
      >
        {label || t("viewNextSteps")}
      </Button>

      {isDescriptionsVisible && (
        <div
          className={cn(
            "relative space-y-4 rounded border border-yellow-500 bg-yellow-100 p-4",
            className,
          )}
        >
          <Button
            variant="ghost"
            size="xs"
            className="absolute right-1 top-1"
            onClick={() => setIsDescriptionsVisible(false)}
          >
            <IconX />
          </Button>
          {children}
        </div>
      )}
    </>
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
