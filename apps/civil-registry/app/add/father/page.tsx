import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { FatherForm } from "@/app/add/father/father-form";
import { generateUUID } from "@/lib/data/dummy-data";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function FatherPage({ params }: ApplicantPageProps) {
  // const { id } = await params;
  const person = await getFormPersonByType("father");
  const id = person?.id ?? generateUUID();

  return <FatherForm id={id} defaultValues={person} />;
}
