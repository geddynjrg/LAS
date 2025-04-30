import { ApplicantForm } from "@/app/apply/[id]/applicant/applicant-form";
import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import type { IdType } from "@/app/apply/[id]/id-type-schema";
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

  const defaultValues = application?.steps_data?.applicant;

  return (
    <>
      <ApplyFormTitle application={application} />
      <ApplyFormStepper activeStep={STEP_NAME} application={application} />

      <ApplicantForm
        id={id}
        defaultValues={{
          ...defaultValues,

          // id type fields
          id_type: defaultValues?.applicant_id_type as IdType,
          id_number: defaultValues?.applicant_id_number,
          birth_certificate_number: defaultValues?.birth_certificate_number,
          // @ts-ignore missing type from API
          birth_certificate_file: defaultValues?.birth_certificate_file,
          // @ts-ignore missing type from API
          alien_id_number: defaultValues?.alien_id_number,
          // @ts-ignore missing type from API
          is_refugee: defaultValues?.is_refugee,

          phones: defaultValues?.applicant_phone_number?.map(parsePhoneNumber),
        }}
      />
    </>
  );
}
