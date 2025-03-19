import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { ReviewForm } from "@/app/add/final-review/review";

export default async function Page() {
  const mother = await getFormPersonByType("mother");
  const father = await getFormPersonByType("father");
  const informant = await getFormPersonByType("informant");
  const child = await getFormPersonByType("child");

  const childValues = Array.isArray(child) ? child[0] : (child ?? {});
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
