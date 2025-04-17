import { notFound, redirect } from "next/navigation";

import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { GuardianForm } from "@/app/apply/[id]/guardian/guardian-form";
import { getApplicationProgress } from "@/lib/api/application";

export interface GuardianPageProps {
  params: Promise<{ id: string }>;
}

export default async function GuardianPage({ params }: GuardianPageProps) {
  const { id } = await params;
  const application = await getApplicationProgress({ id });

  if (!application) {
    notFound();
  }

  if (!application?.available_steps?.includes("guardian")) {
    redirect(`/apply/${id}/course/`);
  }

  console.log("GuardianPage", application);

  const courseId = application?.steps_data?.course?.course;

  return (
    <>
      <ApplyFormTitle courseId={courseId} />

      <ApplyFormStepper activeStep={2} />

      <GuardianForm
        id={id}
        // @ts-ignore TODO: wait for API fix
        defaultValues={application.steps_data?.guardian || {}}
      />
    </>
  );
}
