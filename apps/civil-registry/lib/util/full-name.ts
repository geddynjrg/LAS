import type { Person } from "@/lib/data/person";

export const getFullName = (p: Person) => {
  return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");
};
