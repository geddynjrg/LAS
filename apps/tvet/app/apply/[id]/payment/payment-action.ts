"use server";

import { redirect } from "next/navigation";

export async function paymentAction(formData: FormData) {
  const id = formData.get("application_id");
  const paymentMethod = formData.get("payment_method");

  if (!id || !paymentMethod) {
    throw new Error("Missing id or payment method");
  }

  redirect(`/apply/${id}/success`);
}
