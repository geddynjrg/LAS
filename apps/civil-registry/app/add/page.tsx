import { redirect } from "next/navigation";

import { resetFormReset } from "@/lib/services/birth-registration-service";

export default async function Page() {
  await resetFormReset();
  redirect("/add/child");
}
