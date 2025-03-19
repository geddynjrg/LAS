import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { ChildForm } from "@/app/add/child/child-form";
import { generateUUID } from "@/lib/data/dummy-data";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChildPage({ params }: ApplicantPageProps) {
  // const { id } = await params;
  const child = await getFormPersonByType("child");

  const id = Array.isArray(child)
    ? (child[0]?.id ?? generateUUID())
    : (child?.id ?? generateUUID());
  const defaultValues = Array.isArray(child) ? child[0] : (child ?? { id: id });

  return (
    <>
      <ChildForm id={id} defaultValues={defaultValues} />
    </>
  );
}
