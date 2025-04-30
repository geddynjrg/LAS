import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { ConfirmationForm } from "@/app/apply/[id]/confirmation/confirmation-form";
import {
  ensureStepAvailable,
  type ApplicationStep,
} from "@/app/apply/[id]/stepper-utils";
import { getApplicationProgress } from "@/lib/api/application";

const STEP_NAME = "confirmation" satisfies ApplicationStep;

export interface ConfirmationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfirmationsPage({
  params,
}: ConfirmationsPageProps) {
  const { id } = await params;

  const application = await getApplicationProgress({ id });

  ensureStepAvailable(STEP_NAME, application);

  const defaultValues = application?.steps_data?.confirmation || {};

  return (
    <>
      <ApplyFormTitle application={application} />
      <ApplyFormStepper activeStep={STEP_NAME} application={application} />

      <ConfirmationForm id={id} defaultValues={defaultValues} />
    </>
  );
}
