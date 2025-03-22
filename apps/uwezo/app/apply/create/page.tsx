import { redirect } from "next/navigation";

import { createApplication } from "@/actions/application";

export default async function CreatePage() {
  const newApplication = await createApplication();

  if (!newApplication) {
    return redirect("/dashboard");
  }

  return redirect(`/apply/${newApplication.applicationId}/group-data`);
}
