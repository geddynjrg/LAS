import { redirect } from "next/navigation";

import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { FatherForm } from "@/app/add/father/father-form";
import { generateUUID } from "@/lib/data/dummy-data";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function FatherPage(_props: ApplicantPageProps) {
  // const { id } = await params;
  const mother = await getFormPersonByType("mother");

  if (!mother?.firstName) {
    redirect("/add");
  }
  const person = await getFormPersonByType("father");
  const id = person?.id ?? generateUUID();

  return <FatherForm id={id} defaultValues={person} />;
}
