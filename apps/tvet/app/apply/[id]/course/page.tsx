import { notFound } from "next/navigation";

import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { CourseForm } from "@/app/apply/[id]/course/course-form";
import { getApplicationProgress } from "@/lib/api/application";
import { getInstitutions } from "@/lib/api/institutions";

export interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;

  const [institutions, application] = await Promise.all([
    getInstitutions(),
    getApplicationProgress({ id }),
  ]);

  if (!application) {
    notFound();
  }

  console.log("application", application);

  const defaultValues = application.steps_data?.course || {};

  return (
    <>
      <ApplyFormTitle label="Waithaka Vocational Training Centre">
        Electrical installation training
      </ApplyFormTitle>

      <ApplyFormStepper activeStep={3} />

      <CourseForm
        id={id}
        institutions={institutions}
        // @ts-ignore TODO: wait for API fix
        defaultValues={defaultValues}
      />
    </>
  );
}
