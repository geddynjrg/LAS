"use server";

import { updateApplicationStatus } from "@/lib/data/application";

export async function updateApplicationStatusById(id: string) {
  return updateApplicationStatus(id);
}
