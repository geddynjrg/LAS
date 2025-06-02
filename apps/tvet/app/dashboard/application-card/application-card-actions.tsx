"use client";

import { IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type FC, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Divider } from "@workspace/ui/components/divider";
import { cn } from "@workspace/ui/lib/utils";

import type { ApplicationCardProps } from "@/app/dashboard/application-card/application-card";
import { UploadPaymentProofForm } from "@/app/dashboard/application-card/upload-payment-proof-form";

export const ApplicationCardActions: FC<ApplicationCardProps> = (props) => {
  const t = useTranslations("ApplicationCard");
  if (
    props.payment_status === "proof_uploaded" ||
    props.payment_status === "paid"
  ) {
    return null;
  }

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
        <ApplicationCardPaymentActions
          {...props}
          paymentInfoLink={`/api/v1/application/${props.application_id}/payment-info-pdf`}
          type="application"
        />
      );

    case "approved":
      return (
        <ApplicationCardPaymentActions
          {...props}
          paymentInfoLink={`/api/v1/application/${props.application_id}/course-payment-info-pdf`}
          type="course"
        />
      );

    case "rejected":
      return (
        <ApplicationCardDescriptionActions
          label={t("viewRejectReason")}
          className="border-red-400 bg-red-200"
        >
          <p className="typo-h6">{props.rejection_reason}</p>
          {props.rejection_message}
        </ApplicationCardDescriptionActions>
      );

    default:
      return (
        <ApplicationCardDescriptionActions>
          TODO: Next steps description here
        </ApplicationCardDescriptionActions>
      );
  }
};

const ApplicationCardPaymentActions: FC<{
  application_id?: string;
  paymentInfoLink: string | undefined;
  type: "application" | "course";
}> = ({ application_id, paymentInfoLink, type }) => {
  const t = useTranslations("ApplicationCard");
  const tCommon = useTranslations("Common");
  const [isPaymentProofFormVisible, setIsPaymentProofFormVisible] =
    useState(false);

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

const ApplicationCardDescriptionActions: FC<{
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
