import { CourseForm } from "@/app/apply/[id]/course/course-form";

export interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;

  return (
    <CourseForm
      id={id}
      defaultValues={{
        institute: "institute-1",
        course: "course-1",
        intakePeriod: "intake-1",
      }}
    />
  );
}
