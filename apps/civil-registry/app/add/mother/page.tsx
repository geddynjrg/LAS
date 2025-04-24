import { redirect } from "next/navigation";

import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { MotherForm } from "@/app/add/mother/mother-form";
import { generateUUID } from "@/lib/data/dummy-data";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function MotherPage(_props: ApplicantPageProps) {
  // const { id } = await params;
  const person = await getFormPersonByType("mother");
  const child = await getFormPersonByType("child");
  const id = person?.id ?? generateUUID();

  if (!child[0]?.natureOfBirth) {
    redirect("/add");
  }

  return <MotherForm id={id} defaultValues={person} />;
}
