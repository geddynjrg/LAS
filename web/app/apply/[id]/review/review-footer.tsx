'use client';

import { updateApplicationStatusById } from '@/app/apply/[id]/review/update-application-status-by-id-action';
import { ApplicationStatus } from '@/generated/prisma';
import { syncApplication } from '@/lib/api/sync.service';
import { IconArrowLeft } from '@tabler/icons-react';
import { ActionBar } from '@workspace/ui/components/action-bar';
import { Button } from '@workspace/ui/components/button';
import { ModalButton } from '@workspace/ui/components/modal-button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { type FC, useState } from 'react';

export interface ReviewDataProps {
  id: string;
}

export const ReviewFooter: FC<ReviewDataProps> = ({ id }) => {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ActionBar className="mt-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Button
          variant="secondary"
          type="button"
          onClick={() => router.push(`/apply/${id}/confirmations`)}
        >
          <IconArrowLeft />
          {t('Common.back')}
        </Button>
        <ModalButton
          onConfirm={async () => {
            try {
              setIsSubmitting(true);

              console.log(
                '[SUBMIT] Updating application status to GROUP_MEMBER_CONFIRMATION for:',
                id,
              );

              // Step 1: Update application status
              const result = await updateApplicationStatusById(
                id,
                ApplicationStatus.GROUP_MEMBER_CONFIRMATION,
              );
              console.log('[SUBMIT] Status update result:', result);

              // Step 2: Sync to Drupal immediately
              console.log('[SUBMIT] Syncing application to Drupal...');
              const syncResult = await syncApplication(id, true);

              if (!syncResult.success) {
                throw new Error(
                  syncResult.error || 'Failed to sync application to Drupal',
                );
              }

              // Step 3: Navigate to done page only after successful sync
              router.push(`/apply/${id}/done`);
            } catch (error) {
              console.error('[SUBMIT] Error submitting application:', error);
              setIsSubmitting(false);

              alert(
                `Error submitting application: ${error instanceof Error ? error.message : 'Unknown error'}.\n\nPlease try again or contact support if the problem persists.`,
              );
            }
          }}
          cancelTitle={t('Common.back')}
          confirmTitle={t('Common.submit')}
          modalText={t('ReviewPage.confirmationDescription')}
          modalTitle={t('ReviewPage.confirmationTitle')}
          cancelButtonProps={{ variant: 'secondary' }}
          contentProps={{ size: 'sm' }}
          titleUnderline
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting your application...' : t('Common.submit')}
        </ModalButton>
      </div>
    </ActionBar>
  );
};
