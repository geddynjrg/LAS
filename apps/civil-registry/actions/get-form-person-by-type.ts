"use server";

import type { BirthRegistrationStore } from "@/lib/data/person";
import { getFormPerson } from "@/lib/services/birth-registration-service";

export async function getFormPersonByType<
  T extends keyof BirthRegistrationStore,
>(type: T) {
  return getFormPerson(type);
}
