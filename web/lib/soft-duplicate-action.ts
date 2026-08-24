'use server';

import { getSession } from '@/lib/session';
import {
  type SoftDuplicateResult,
  checkSoftDuplicatesAcrossApplications,
} from '@/lib/soft-duplicate-check';

/**
 * Session-gated soft duplicate check used from apply forms.
 * Avoids /api/* middleware rewrite to Drupal (prod-admin).
 */
export async function checkSoftDuplicatesAction(input: {
  phone?: string;
  nationalId?: string;
  applicationId?: string;
}): Promise<SoftDuplicateResult> {
  const session = await getSession();
  if (!session) {
    return { phoneDuplicate: false, nationalIdDuplicate: false, message: '' };
  }

  return checkSoftDuplicatesAcrossApplications({
    phone: input.phone,
    nationalId: input.nationalId,
    excludeApplicationId: input.applicationId,
  });
}
