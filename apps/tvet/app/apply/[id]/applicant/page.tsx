import { ApplicantForm } from "@/app/apply/[id]/applicant/applicant-form";
import type { IdType } from "@/app/apply/[id]/applicant/applicant-schema";
import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import {
  ensureStepAvailable,
  type ApplicationStep,
} from "@/app/apply/[id]/stepper-utils";
import { getApplicationProgress } from "@/lib/api/application";
import { parsePhoneNumber } from "@/lib/phone";

const STEP_NAME = "applicant" satisfies ApplicationStep;

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicantPage({ params }: ApplicantPageProps) {
  const { id } = await params;

  const application = await getApplicationProgress({ id });

  ensureStepAvailable(STEP_NAME, application);

  const defaultValues = application?.steps_data?.applicant || {};

  return (
    <>
      <ApplyFormTitle application={application} />
      <ApplyFormStepper activeStep={STEP_NAME} application={application} />

      <ApplicantForm
        id={id}
        // @ts-ignore wait for the API fix
        defaultValues={{
          ...defaultValues,
          // TODO: wait for the api fix
          applicant_id_type: defaultValues.applicant_id_type as IdType,
          phones: defaultValues.applicant_phone_number?.map(parsePhoneNumber),
        }}
      />
    </>
  );
}
