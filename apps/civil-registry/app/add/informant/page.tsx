import { redirect } from "next/navigation";

import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { InformantForm } from "@/app/add/informant/informant-form";
import { generateUUID } from "@/lib/data/dummy-data";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function FatherPage(_props: ApplicantPageProps) {
  // const { id } = await params;
  const informant = await getFormPersonByType("informant");
  const mother = await getFormPersonByType("mother");
  const father = await getFormPersonByType("father");
  const child = await getFormPersonByType("child");
  const personId = informant?.id ?? generateUUID();

  if (!mother?.firstName && !child[0]?.abandoned) {
    redirect("/add");
  }

  return (
    <InformantForm
      id={personId}
      informant={
        informant?.id ? informant : { id: personId, informantType: "Other" }
      }
      mother={mother}
      father={father}
      isAbandoned={child[0]?.abandoned ?? false}
    />
  );
}
