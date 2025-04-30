import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { GuardianForm } from "@/app/apply/[id]/guardian/guardian-form";
import type { GuardianRole } from "@/app/apply/[id]/guardian/guardian-schema";
import type { IdType } from "@/app/apply/[id]/id-type-schema";
import {
  ensureStepAvailable,
  getPrevStep,
  type ApplicationStep,
} from "@/app/apply/[id]/stepper-utils";
import { getApplicationProgress } from "@/lib/api/application";
import { parsePhoneNumber } from "@/lib/phone";

const STEP_NAME = "guardian" satisfies ApplicationStep;

export interface GuardianPageProps {
  params: Promise<{ id: string }>;
}

export default async function GuardianPage({ params }: GuardianPageProps) {
  const { id } = await params;
  const application = await getApplicationProgress({ id });

  ensureStepAvailable(STEP_NAME, application);

  const defaultValues = application?.steps_data?.guardian;

  return (
    <>
      <ApplyFormTitle application={application} />
      <ApplyFormStepper activeStep={STEP_NAME} application={application} />

      <GuardianForm
        id={id}
        defaultValues={{
          ...defaultValues,
          guardian_role: defaultValues?.guardian_role as
            | GuardianRole
            | undefined,
          phones: defaultValues?.guardian_phone_number?.map(parsePhoneNumber),

          // id type fields
          id_type: defaultValues?.guardian_id_type as IdType,
          id_number: defaultValues?.guardian_id_number,
          birth_certificate_number:
            defaultValues?.guardian_birth_certificate_number,
          birth_certificate_file:
            defaultValues?.guardian_birth_certificate_file,
          alien_id_number: defaultValues?.guardian_alien_id_number,
          is_refugee: defaultValues?.guardian_is_refugee,
        }}
        prevStep={getPrevStep(STEP_NAME, application)}
      />
    </>
  );
}
