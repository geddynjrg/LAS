"use server";

import { findPersonById } from "@/lib/services/person-service";

export async function getPersonById(id: string) {
  return findPersonById(id);
}
