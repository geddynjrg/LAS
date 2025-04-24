import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { ChildForm } from "@/app/add/child/child-form";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChildPage(_props: ApplicantPageProps) {
  const child = await getFormPersonByType("child");

  return (
    <>
      <ChildForm defaultValues={child} />
    </>
  );
}
