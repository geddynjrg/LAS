"use server";

import type { ValidationStatus } from "@/lib/data/person";
import { updatePersonStatus } from "@/lib/services/person-service";

export async function updatePersonStatusById(
  id: string,
  status: ValidationStatus,
) {
  return updatePersonStatus(id, status);
}
