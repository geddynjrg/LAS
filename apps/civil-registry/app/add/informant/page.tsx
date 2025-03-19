import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { InformantForm } from "@/app/add/informant/informant-form";
import { generateUUID } from "@/lib/data/dummy-data";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function FatherPage({ params }: ApplicantPageProps) {
  // const { id } = await params;
  const informant = await getFormPersonByType("informant");
  const mother = await getFormPersonByType("mother");
  const father = await getFormPersonByType("father");
  const personId = informant?.id ?? generateUUID();

  return (
    <InformantForm
      id={personId}
      informant={
        informant?.id ? informant : { id: personId, informantType: "Other" }
      }
      mother={mother}
      father={father}
    />
  );
}
