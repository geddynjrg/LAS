"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  initiatePaymentSchema,
  type InitiatePaymentSchema,
} from "@/app/apply/[id]/payment/mpesa/initiate-payment-schema";
import { initiateMpesaPayment } from "@/lib/api/payment";
import { formatPhoneNumber } from "@/lib/phone";

export const initiatePaymentAction: FormAction<InitiatePaymentSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();
  const values = getFormZodDataValues(formData, initiatePaymentSchema);

  if (!id) {
    return {
      success: false,
      errors: {},
      message: "ID is required",
      values,
    };
  }

  const { error, data, success } = initiatePaymentSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  const payment = await initiateMpesaPayment({
    application_id: id,
    phone_number: formatPhoneNumber(data),
  });

  if (payment.error) {
    console.warn("mpesaPayment error", payment.error);

    return {
      success: false,
      message: payment.error.message,
      errors: {},
      values,
    };
  }

  return redirect(
    `/apply/${id}/payment/mpesa/${payment.data?.data?.checkout_request_id}`,
  );
};
