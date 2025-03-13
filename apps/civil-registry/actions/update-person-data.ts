"use server";

import type { Person } from "@/lib/data/person";
import { updatePerson } from "@/lib/services/person-service";

export async function updatePersonById(id: string, data: Partial<Person>) {
  return updatePerson(id, data);
}
