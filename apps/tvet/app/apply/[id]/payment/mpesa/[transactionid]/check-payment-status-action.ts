"use server";

import { checkMpesaPaymentStatus } from "@/lib/api/payment";

export type PaymentStatus = "pending" | "completed" | "cancelled" | "failed";

export interface PaymentStatusInfo {
  application_id?: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  transaction_id?: string | null;
  amount?: number;
  phone_number?: string;
  payment_type?: "application" | "course";
  created?: string;
  changed?: string;
  completed?: string | null;
  application_payment_status?: "not_paid" | "paid";
}
interface CheckPaymentStatusActionResponse {
  status: PaymentStatus;
  error: string | null;
  data?: PaymentStatusInfo | null;
}

export const checkPaymentStatusAction: (
  transaction_id?: string,
) => Promise<CheckPaymentStatusActionResponse> = async (transaction_id) => {
  if (!transaction_id) {
    return {
      status: "failed",
      error: "Transaction ID is required",
      data: null,
    };
  }

  const payment = await checkMpesaPaymentStatus({
    transaction_id: transaction_id,
  });

  if (!payment || payment.error) {
    console.warn("checkPaymentStatusAction error", payment.error);

    return {
      status: "failed",
      data: null,
      error: payment.error.message ?? "Something went wrong",
    };
  }

  return {
    status: payment.data?.data?.status ?? "pending",
    data: payment.data.data,
    error: null,
  };
};
