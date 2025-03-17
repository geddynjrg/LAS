import { redirect } from "next/navigation";

import { createApplication } from "@/actions/application";

export default async function CreatePage() {
  const newApplication = await createApplication();

  console.log(newApplication);

  if (!newApplication) {
    return redirect("/dashboard");
  }

  return redirect(`/apply/${newApplication.applicationId}/group-data`);
}
