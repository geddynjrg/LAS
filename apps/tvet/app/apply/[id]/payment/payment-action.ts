"use server";

import { redirect } from "next/navigation";

export async function paymentAction(formData: FormData) {
  const id = formData.get("application_id");
  const paymentMethod = formData.get("payment_method");

  if (!id || !paymentMethod) {
    throw new Error("Missing id or payment method");
  }

  if (id && paymentMethod === "m_pesa") {
    return redirect(`/apply/${id}/payment/mpesa`);
  }

  redirect(`/dashboard?pay_later_id=${id}`);
}
