import { ApplicantForm } from "@/app/apply/[id]/applicant/applicant-form";
import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { getApplicationProgress } from "@/lib/api/application";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}

export default async function ApplicantPage({
  params,
  searchParams,
}: ApplicantPageProps) {
  const { id } = await params;
  const { course } = await searchParams;

  const application =
    id === "new" ? undefined : await getApplicationProgress({ id });

  const courseId = application?.steps_data?.course?.course || course;
  const defaultValues = application?.steps_data?.applicant || {};

  return (
    <>
      <ApplyFormTitle courseId={courseId} />

      <ApplyFormStepper activeStep={1} />

      <ApplicantForm
        id={id}
        courrseId={course}
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
