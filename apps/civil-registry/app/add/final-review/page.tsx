import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { ReviewForm } from "@/app/add/final-review/review";

export default async function Page() {
  const mother = await getFormPersonByType("mother");
  const father = await getFormPersonByType("father");
  const informant = await getFormPersonByType("informant");
  const child = await getFormPersonByType("child");

  if (!child || !mother || !father || !informant) {
    return null;
  }

  return (
    <ReviewForm
      child={child}
      mother={mother}
      father={father}
      informant={informant}
    />
  );
}
