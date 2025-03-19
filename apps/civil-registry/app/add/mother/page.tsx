import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { MotherForm } from "@/app/add/mother/mother-form";
import { generateUUID } from "@/lib/data/dummy-data";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function MotherPage({ params }: ApplicantPageProps) {
  // const { id } = await params;
  const person = await getFormPersonByType("mother");
  const id = person?.id ?? generateUUID();

  return <MotherForm id={id} defaultValues={person} />;
}
