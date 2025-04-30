import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { GuardianForm } from "@/app/apply/[id]/guardian/guardian-form";
import {
  ensureStepAvailable,
  getPrevStep,
  type ApplicationStep,
} from "@/app/apply/[id]/stepper-utils";
import { getApplicationProgress } from "@/lib/api/application";

const STEP_NAME = "guardian" satisfies ApplicationStep;

export interface GuardianPageProps {
  params: Promise<{ id: string }>;
}

export default async function GuardianPage({ params }: GuardianPageProps) {
  const { id } = await params;
  const application = await getApplicationProgress({ id });

  ensureStepAvailable(STEP_NAME, application);

  const defaultValues = application?.steps_data?.applicant || {};

  return (
    <>
      <ApplyFormTitle application={application} />
      <ApplyFormStepper activeStep={STEP_NAME} application={application} />

      <GuardianForm
        id={id}
        // @ts-ignore wait for the API fix
        defaultValues={defaultValues}
        prevStep={getPrevStep(STEP_NAME, application)}
      />
    </>
  );
}
