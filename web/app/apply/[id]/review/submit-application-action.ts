'use server';

import { ApplicationStatus } from '@/generated/prisma';
import { syncApplication } from '@/lib/api/sync.service';
import { updateApplicationStatus } from '@/lib/data/application';
import { after } from 'next/server';

/**
 * Mark the application submitted and process Drupal/LMS sync after the
 * HTTP response so nginx does not time out waiting on LMS import.
 */
export async function submitApplicationAction(applicationId: string) {
  await updateApplicationStatus(applicationId, ApplicationStatus.SUBMITTED);

  after(async () => {
    try {
      const result = await syncApplication(applicationId, false);
      if (!result.success) {
        console.error(
          `[SUBMIT] Background sync failed for ${applicationId}:`,
          result.error,
        );
      }

      const cronSecret = process.env.CRON_SECRET;
      await fetch('http://127.0.0.1:3000/api/cron/sync-applications', {
        method: 'POST',
        headers: cronSecret
          ? { Authorization: `Bearer ${cronSecret}` }
          : undefined,
      }).catch((error) => {
        console.error('[SUBMIT] Failed to trigger sync cron:', error);
      });
    } catch (error) {
      console.error(
        `[SUBMIT] Background sync error for ${applicationId}:`,
        error,
      );
    }
  });

  return { success: true as const };
}
