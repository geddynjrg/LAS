"use client";

import { IconDownload, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FC, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { DataPair } from "@workspace/ui/components/data-pair";
import { Divider } from "@workspace/ui/components/divider";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Underline } from "@workspace/ui/components/underline";
import { cn } from "@workspace/ui/lib/utils";

export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export const FILE_ACCEPT = {
  "image/*": [".jpg", ".jpeg", ".png"],
  "application/pdf": [".pdf"],
};

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

export interface ApplicationStatusCardProps {
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

export const ApplicationStatusCard: FC<ApplicationStatusCardProps> = (
  props,
) => {
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

      <ApplicationActions {...props} />
    </Card>
  );
};

const ApplicationActions: FC<ApplicationStatusCardProps> = (props) => {
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
        <Form
          className={cn(
            "relative space-y-4 rounded border border-yellow-500 bg-yellow-100 p-4",
            isHighlighted && "repeat-[4] animate-pulse duration-500",
          )}
        >
          <Button
            variant="ghost"
            size="xs"
            className="absolute right-1 top-1"
            onClick={() => setIsPaymentProofFormVisible(false)}
          >
            <IconX />
          </Button>
          <p>
            Please complete the transfer and upload proof of payment, such as a
            receipt or screenshot.
          </p>
          <Underline asChild>
            <a
              href={`/apply/${application_id}/payment-info-pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconDownload className="mr-2" /> Download payment instructions
            </a>
          </Underline>

          <Field
            name="upload"
            label="Proof of payment"
            required
            control={(props) => (
              <FileUploadInput
                accept={FILE_ACCEPT}
                maxSize={MAX_FILE_SIZE}
                {...props}
              />
            )}
          />
          <SubmitButton className="w-full">
            Upload proof of payment
          </SubmitButton>
        </Form>
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

function getCardType(application: ApplicationStatusCardProps) {
  switch (application.application_status) {
    case "accepted":
      return CardType.success;
    case "rejected":
      return CardType.danger;
    default:
      return CardType.warning;
  }
}

function getStatusText(application: ApplicationStatusCardProps) {
  if (application.application_status === "submitted") {
    return application.payment_status;
  }

  return application.application_status;
}
