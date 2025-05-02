"use client";

import { IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FC, type ReactNode } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { DataPair } from "@workspace/ui/components/data-pair";
import { Divider } from "@workspace/ui/components/divider";
import { cn } from "@workspace/ui/lib/utils";

import { UploadPaymentProofForm } from "@/app/dashboard/application-card/upload-payment-proof-form";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "payment_pending"
  | "paid"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "pending"
  | "confirmed";

export type ApplicationPaymentStatus =
  | "unpaid"
  | "pending"
  | "proof_uploaded"
  | "paid"
  | "rejected";

export interface ApplicationCardProps {
  id?: number;
  application_id?: string;
  application_status?: ApplicationStatus;
  payment_status?: ApplicationPaymentStatus;
  institution?: string;
  course?: string;
  className?: string;
}

enum CardType {
  success = "success",
  danger = "danger",
  warning = "warning",
}

export const ApplicationCard: FC<ApplicationCardProps> = (props) => {
  const search = useSearchParams();

  const successUploadId = search.get("payment_proof_success");

  const isUploadSuccess = successUploadId === props.application_id;

  const t = useTranslations("ApplicationStatusCard");

  const type = getCardType(props);

  return (
    <Card
      className={cn(
        type === CardType.danger && "border-red-400",
        type === CardType.success && "border-primary",
        props.className,
      )}
      title={props.course}
      caption={props.institution}
      statusLabel={getStatusText(props)}
      variant={type}
    >
      <div className="flex-1">
        <DataPair className={cn("justify-around")}>
          {/* 
           <DataNode label="Intake">{application.intake}</DataNode>
            <DataNode label="Duration">{application.duration}</DataNode> 
          */}
        </DataPair>
      </div>

      {isUploadSuccess && (
        <Alert variant="success" className="mb-4">
          Payment proof uploaded successfully
        </Alert>
      )}

      <ApplicationActions {...props} />
    </Card>
  );
};

const ApplicationActions: FC<ApplicationCardProps> = (props) => {
  switch (props.application_status) {
    case "draft":
      return (
        <Button asChild>
          <Link href={`/apply/${props.application_id}/applicant`}>
            Edit application
          </Link>
        </Button>
      );

    case "submitted":
      return <PaymentActions {...props} />;

    case "rejected":
      return (
        <DescriptionActions label="View reason for rejection">
          TODO: Reject reason here
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

const PaymentActions: FC<{ application_id?: string }> = ({
  application_id,
}) => {
  const search = useSearchParams();
  const highlightedApplicationId = search.get("pay_later_id");

  const isHighlighted = highlightedApplicationId === application_id;
  const [isPaymentProofFormVisible, setIsPaymentProofFormVisible] =
    useState(isHighlighted);

  return (
    <>
      <Button className="w-full" asChild disabled>
        <Link href="#">Pay using M-Pesa</Link>
      </Button>

      <Divider>or</Divider>
      {isPaymentProofFormVisible ? (
        <UploadPaymentProofForm
          isHighlighted={isHighlighted}
          onClose={() => setIsPaymentProofFormVisible(false)}
          application_id={application_id || ""}
        />
      ) : (
        <Button
          className="w-full"
          onClick={() => setIsPaymentProofFormVisible(true)}
        >
          Upload proof of payment
        </Button>
      )}
    </>
  );
};

const DescriptionActions: FC<{ label?: string; children: ReactNode }> = ({
  label,
  children,
}) => {
  const [isDescriptionsVisible, setIsDescriptionsVisible] = useState(false);
  return (
    <>
      <Button
        className="w-full"
        onClick={() => setIsDescriptionsVisible((v) => !v)}
      >
        {label || "View next steps"}
      </Button>

      {isDescriptionsVisible && (
        <div className="relative space-y-4 rounded border border-yellow-500 bg-yellow-100 p-4">
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
    case "accepted":
      return CardType.success;
    case "rejected":
      return CardType.danger;
    default:
      return CardType.warning;
  }
}

function getStatusText(application: ApplicationCardProps) {
  if (application.application_status === "submitted") {
    return application.payment_status;
  }

  return application.application_status;
}
