import type { Person } from "@/lib/data/person";

export const getFullName = (p: Person) => {
  const fullName = [p.firstName, p.middleName, p.lastName]
    .filter(Boolean)
    .join(" ");
  return fullName || "–";
};
