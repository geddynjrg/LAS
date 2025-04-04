import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { ChildForm } from "@/app/add/child/child-form";
import { generateUUID } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChildPage(_props: ApplicantPageProps) {
  const child = await getFormPersonByType("child");

  const id =
    child && Array.isArray(child)
      ? (child?.[0]?.id ?? generateUUID())
      : generateUUID();
  const defaultValues = Array.isArray(child)
    ? child
    : child
      ? [child]
      : [{ id: id } as Partial<Person>];

  return (
    <>
      <ChildForm id={id} defaultValues={defaultValues} />
    </>
  );
}
