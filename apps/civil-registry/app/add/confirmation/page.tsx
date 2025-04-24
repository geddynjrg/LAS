"use server";

import { ConfirmationForm } from "@/app/add/confirmation/confirmation-form";
import { getFormPerson } from "@/lib/services/birth-registration-service";

export default async function ConfirmationPage() {
  const person = await getFormPerson("mother");

  //   if (!person?.id) {
  //     throw new Error("Person not found");
  //   }

  return <ConfirmationForm defaultValues={person} />;
}
