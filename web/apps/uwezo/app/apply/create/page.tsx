import { redirect } from "next/navigation";

import { createApplication } from "@/lib/data/application-db";

export default async function CreatePage() {
  const newApplication = await createApplication();

  if (!newApplication) {
    return redirect("/dashboard");
  }

  return redirect(`/apply/${newApplication.applicationId}/group-data`);
}
