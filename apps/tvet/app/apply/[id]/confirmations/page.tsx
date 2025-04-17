import { notFound } from "next/navigation";

import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { ConfirmationsForm } from "@/app/apply/[id]/confirmations/confirmations-form";
import { getApplicationProgress } from "@/lib/api/application";

export interface ConfirmationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfirmationsPage({
  params,
}: ConfirmationsPageProps) {
  const { id } = await params;

  const application = await getApplicationProgress({ id });

  if (!application) {
    notFound();
  }

  console.log("application", application);

  const defaultValues = application.steps_data?.confirmation || {};
  const courseId = application?.steps_data?.course?.course;

  return (
    <>
      <ApplyFormTitle courseId={courseId} />

      <ApplyFormStepper activeStep={4} />

      <ConfirmationsForm id={id} defaultValues={defaultValues} />
    </>
  );
}
