'use server';

import { ApplicationStatus } from '@/generated/prisma';
import { updateApplicationStatus } from '@/lib/data/application-db';

export async function updateApplicationStatusById(
  id: string,
  status?: ApplicationStatus,
) {
  return updateApplicationStatus(id, status);
}
