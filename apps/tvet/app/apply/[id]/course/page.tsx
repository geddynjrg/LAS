import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { CourseForm } from "@/app/apply/[id]/course/course-form";
import {
  ensureStepAvailable,
  getPrevStep,
  type ApplicationStep,
} from "@/app/apply/[id]/stepper-utils";
import { getApplicationProgress } from "@/lib/api/application";
import { getInstitutions } from "@/lib/api/institutions";

const STEP_NAME = "course" satisfies ApplicationStep;

export interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;

  const [institutions, application] = await Promise.all([
    getInstitutions(),
    getApplicationProgress({ id }),
  ]);

  ensureStepAvailable(STEP_NAME, application);

  const defaultValues = application?.steps_data?.course || {};

  return (
    <>
      <ApplyFormTitle application={application} />
      <ApplyFormStepper activeStep={STEP_NAME} application={application} />

      <CourseForm
        id={id}
        institutions={institutions}
        // @ts-ignore TODO: wait for the API to support multiple files
        defaultValues={defaultValues}
        prevStep={getPrevStep(STEP_NAME, application)}
      />
    </>
  );
}
