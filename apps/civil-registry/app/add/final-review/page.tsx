import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { ReviewForm } from "@/app/add/final-review/review";
import { generateUUID } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";

export default async function Page() {
  const mother = await getFormPersonByType("mother");
  const father = await getFormPersonByType("father");
  const informant = await getFormPersonByType("informant");
  const child = await getFormPersonByType("child");

  const childValues = Array.isArray(child)
    ? child
    : child
      ? [child]
      : [{ id: generateUUID() } as Partial<Person>];
  if (!childValues || !mother || !father || !informant) return null;

  return (
    <ReviewForm
      child={childValues}
      mother={mother}
      father={father}
      informant={informant}
    />
  );
}
