"use server";

import { updateApplicationStatus } from "@/lib/data/application-db";

export async function updateApplicationStatusById(id: string) {
  return updateApplicationStatus(id);
}
