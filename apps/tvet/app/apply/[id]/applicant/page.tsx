import { ApplicantForm } from "@/app/apply/[id]/applicant/applicant-form";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicantPage({ params }: ApplicantPageProps) {
  const { id } = await params;

  return <ApplicantForm id={id} defaultValues={{ firstName: "test" }} />;
}
