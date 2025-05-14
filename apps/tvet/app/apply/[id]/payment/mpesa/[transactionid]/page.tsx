"use client";

import { IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { IconCheck } from "@workspace/ui/components/icon-check";
import { Loader } from "@workspace/ui/components/loader";
import { useInterval } from "@workspace/ui/hooks/use-interval";
import { useMount } from "@workspace/ui/hooks/use-mount";
import { cn } from "@workspace/ui/lib/utils";

import { checkPaymentStatusAction } from "@/app/apply/[id]/payment/mpesa/[transactionid]/check-payment-status.action";

const REFECTH_INTERVAL = 2000; // 2 seconds

export default function MpesaPaymentStatusPage() {
  const router = useRouter();
  const { id, transactionid } = useParams<{
    id: string;
    transactionid: string;
  }>();

  const [status, setStatus] = useState<
    "pending" | "completed" | "cancelled" | "failed"
  >("pending");
  const [phone, setPhone] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  // update M-Pesa payment status
  const updateStatus = async () => {
    try {
      const res = await checkPaymentStatusAction(transactionid);
      console.log("status response", res.status);

      setError(res.error);
      setPhone(res.phone);
      setStatus(res.status);
    } catch (error) {
      console.error("Error while checking transaction status:", error);
      setStatus("failed");
    }
  };

  // refech status info periodically
  useInterval(updateStatus, status === "pending" ? REFECTH_INTERVAL : null);

  useMount(() => {
    updateStatus();
  });

  // redirect to success page if status is completed
  useEffect(() => {
    if (status === "completed") {
      console.log("Payment completed, do the redirect");
      router.push(`/apply/${id}/success`);
    }
    if (status === "cancelled") {
      router.push(`/apply/${id}/payment`);
    }
  }, [status, id, router]);

  return (
    <Container className="mb-8 flex flex-1 flex-col space-y-4">
      <div>
        <div className={cn("flex justify-between", "typo-body-small")}>
          <div>{new Date().toLocaleDateString()}</div>
          <div>{transactionid}</div>
        </div>
        <h2 className={cn("typo-h2")}>{"M-Pesa payment"}</h2>
      </div>

      <div className="m-auto max-w-2xl">
        {status === "completed" ? (
          <ConfirmedSection />
        ) : status === "cancelled" || status === "failed" || !transactionid ? (
          <FailedSection error={error} />
        ) : (
          <PendingSection phone={phone} />
        )}
      </div>
    </Container>
  );
}

const ConfirmedSection: FC<{ className?: string }> = ({ className }) => {
  const t = useTranslations("MpesaPayment");

  return (
    <div
      className={cn(
        "flex flex-grow flex-col items-center justify-center gap-3",
        "text-center",
        className,
      )}
    >
      <IconCheck className={cn("mb-5 size-32")} />
      <h3
        className={cn(
          "typo-h3",
          "max-w-90 w-full",
          "confirmation-text-opacity",
        )}
      >
        {t("successMessage")}
      </h3>
    </div>
  );
};

const FailedSection: FC<{ className?: string; error: string | null }> = ({
  error,
  className,
}) => {
  const t = useTranslations("MpesaPayment");

  return (
    <div
      className={cn(
        "flex flex-grow flex-col items-center justify-center gap-3",
        "text-center",
        className,
      )}
    >
      <IconX className={cn("mb-5 size-32 text-red-700")} />
      <h3
        className={cn(
          "typo-h3",
          "max-w-90 w-full",
          "confirmation-text-opacity",
        )}
      >
        {error ?? t("errorMessage")}
      </h3>
    </div>
  );
};

const PendingSection: FC<{
  phone?: string;
  className?: string;
}> = ({ phone }) => {
  const t = useTranslations("MpesaPayment");
  return (
    <div
      className={cn(
        "flex flex-grow flex-col items-center justify-center gap-3",
        "text-center",
      )}
    >
      <Loader className={cn("mb-5")} />
      <h3 className={cn("typo-h3", "px-4", "max-w-90 w-full")}>
        {t("pendingMessage")}
      </h3>
      <div>
        <div className={cn("typo-h5 font-normal")}>{phone}</div>
      </div>
    </div>
  );
};
