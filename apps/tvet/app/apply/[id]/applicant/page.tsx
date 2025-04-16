import { ApplicantForm } from "@/app/apply/[id]/applicant/applicant-form";
import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { getApplicationProgress } from "@/lib/api/application";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicantPage({ params }: ApplicantPageProps) {
  const { id } = await params;

  const defaultValues =
    id === "new"
      ? {}
      : (await getApplicationProgress({ id }))?.steps_data?.applicant || {};

  console.log({ defaultValues });

  return (
    <>
      <ApplyFormTitle label="Waithaka Vocational Training Centre">
        Electrical installation training
      </ApplyFormTitle>

      <ApplyFormStepper activeStep={1} />

      <ApplicantForm
        id={id}
        // @ts-ignore TODO: wait for API fix
        defaultValues={{
          ...defaultValues,
          // TODO: wait for the api fix
          phones: defaultValues.applicant_phone_number
            ? [{ phone: defaultValues.applicant_phone_number, callingCode: "" }]
            : [],
        }}
      />
    </>
  );
}
