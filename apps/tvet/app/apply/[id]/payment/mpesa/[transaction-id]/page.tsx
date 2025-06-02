"use client";

import { IconX } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Currency } from "@workspace/ui/components/currency";
import { IconCheck } from "@workspace/ui/components/icon-check";
import { Loader } from "@workspace/ui/components/loader";
import { useInterval } from "@workspace/ui/hooks/use-interval";
import { useMount } from "@workspace/ui/hooks/use-mount";
import { cn } from "@workspace/ui/lib/utils";

import {
  checkPaymentStatusAction,
  type PaymentStatusInfo,
} from "./check-payment-status-action";

const REFETCH_INTERVAL = 2000; // 2 seconds

export default function MpesaPaymentStatusPage() {
  const router = useRouter();
  const format = useFormatter();
  const { id, "transaction-id": transactionId } = useParams<{
    id: string;
    "transaction-id": string;
  }>();

  const [status, setStatus] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);
  const [paymentStatusInfo, setPaymentStatusInfo] =
    useState<PaymentStatusInfo | null>();

  console.log("MpesaPaymentStatusPage", transactionId);

  // update M-Pesa payment status
  const updateStatus = async () => {
    try {
      const res = await checkPaymentStatusAction(transactionId);
      setPaymentStatusInfo(res.data);
      setError(res.error);
      setStatus(res.status);
    } catch (error) {
      console.error("Error while checking transaction status:", error);
      setError("Error while checking transaction status");
      setStatus("failed");
    }
  };

  // refetch status info periodically
  useInterval(updateStatus, status === "pending" ? REFETCH_INTERVAL : null);

  useMount(() => {
    updateStatus();
  });

  // redirect to success page if status is completed
  useEffect(() => {
    if (status === "completed") {
      router.push(`/apply/${id}/success`);
    }
    if (status === "cancelled") {
      router.push(`/apply/${id}/payment`);
    }
  }, [id, status, router]);

  return (
    <Container className="mb-8 flex flex-1 flex-col space-y-4">
      <div>
        <div className={cn("flex justify-between", "typo-body-small")}>
          <div>{format.dateTime(new Date())}</div>
          <div>{transactionId}</div>
        </div>
        <h2 className={cn("typo-h2")}>{"M-Pesa payment"}</h2>
      </div>

      <div className="m-auto max-w-2xl">
        {status === "completed" ? (
          <ConfirmedSection />
        ) : status === "cancelled" || status === "failed" || !transactionId ? (
          <FailedSection error={error} />
        ) : (
          <PendingSection phone={paymentStatusInfo?.phone_number} />
        )}
        {status === "pending" && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <div className={cn("typo-h5 font-normal")}>
              {paymentStatusInfo?.transaction_id}
            </div>
            {paymentStatusInfo?.amount && (
              <div className={cn("typo-h5 font-normal")}>
                <Currency
                  className="font-bold"
                  amount={paymentStatusInfo?.amount}
                  currency="KES"
                />
              </div>
            )}
          </div>
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
