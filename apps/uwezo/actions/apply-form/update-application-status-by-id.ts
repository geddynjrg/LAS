"use server";

import { updateApplicationStatus } from "@/actions/application";

export async function updateApplicationStatusById(id: string) {
  return updateApplicationStatus(id);
}
