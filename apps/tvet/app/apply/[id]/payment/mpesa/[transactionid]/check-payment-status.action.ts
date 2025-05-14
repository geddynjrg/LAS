"use server";

import { checkMpesaPaymentStatus } from "@/lib/api/payment";

interface CheckPaymentStatusActionResponse {
  status: "failed" | "pending" | "completed" | "cancelled";
  error: string | null;
  phone?: string;
}

export const checkPaymentStatusAction: (
  transaction_id?: string,
) => Promise<CheckPaymentStatusActionResponse> = async (transaction_id) => {
  if (!transaction_id) {
    return {
      status: "failed",
      error: "Transaction ID is required",
    };
  }

  const payment = await checkMpesaPaymentStatus({
    transaction_id: transaction_id,
  });

  if (!payment || payment.error) {
    console.warn("checkPaymentStatusAction error", payment.error);

    return {
      status: "failed",
      error: payment.error.message ?? "Something went wrong",
    };
  }

  return {
    status: payment.data?.data?.status ?? "pending",
    phone: payment.data?.data?.phone_number,
    error: null,
  };
};
