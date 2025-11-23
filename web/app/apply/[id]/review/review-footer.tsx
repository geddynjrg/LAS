'use client';

import { updateApplicationStatusById } from '@/app/apply/[id]/review/update-application-status-by-id-action';
import { validateApplicationForSubmission } from '@/lib/validation/application-validation';
import { ApplicationStatus } from '@/generated/prisma';
import { syncApplication } from '@/lib/api/sync.service';
import { IconArrowLeft } from '@tabler/icons-react';
import { ActionBar } from '@workspace/ui/components/action-bar';
import { Button } from '@workspace/ui/components/button';
import { ModalButton } from '@workspace/ui/components/modal-button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { type FC, useState } from 'react';
import { getApplicationById } from '@/lib/data/application';
import type { ApplicationData } from '@/lib/types/application.types';

export interface ReviewDataProps {
  id: string;
}

export const ReviewFooter: FC<ReviewDataProps> = ({ id }) => {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsValidating(true);

      // Fetch the latest application data - this returns ApplicationData
      const application: ApplicationData | undefined = await getApplicationById(id);
      
      if (!application) {
        throw new Error('Application not found');
      }

      // Validate the application using ApplicationData type
      const validation = validateApplicationForSubmission(application);
      
      if (!validation.isValid) {
        // Create a detailed error message
        let errorMessage = 'Cannot submit application. Please fix the following issues:\n\n';
        
        // Show critical errors first
        if (validation.errors.length > 0) {
          errorMessage += '❌ Critical Issues:\n';
          validation.errors.forEach(error => {
            errorMessage += `• ${error}\n`;
          });
          errorMessage += '\n';
        }

        // Show missing fields
        if (validation.missingFields.length > 0) {
          errorMessage += '📝 Missing Required Information:\n';
          validation.missingFields.forEach(field => {
            errorMessage += `• ${field}\n`;
          });
          errorMessage += '\n';
        }

        // Show warnings
        if (validation.warnings.length > 0) {
          errorMessage += '⚠️  Warnings:\n';
          validation.warnings.forEach(warning => {
            errorMessage += `• ${warning}\n`;
          });
        }

        // Add guidance
        errorMessage += '\nPlease complete all required steps before submitting.';

        alert(errorMessage);
        return;
      }

      // If validation passes, show final confirmation
      const finalConfirmation = confirm(
        'Are you sure you want to submit your application?\n\n' +
        '✅ All required information is complete\n' +
        '✅ All members have responded\n' +
        '✅ 75% of members have consented\n' +
        '✅ All declarations are confirmed\n\n' +
        'Once submitted, you cannot make changes to the application.'
      );

      if (!finalConfirmation) {
        return;
      }

      // Proceed with submission
      setIsSubmitting(true);

      console.log('[SUBMIT] Validated application, proceeding with submission for:', id);

      // Step 1: Update application status
      const result = await updateApplicationStatusById(
        id,
        ApplicationStatus.SUBMITTED,
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
      setIsValidating(false);

      alert(
        `Error submitting application: ${error instanceof Error ? error.message : 'Unknown error'}.\n\nPlease try again or contact support if the problem persists.`,
      );
    }
  };

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
          onConfirm={handleSubmit}
          cancelTitle={t('Common.back')}
          confirmTitle={t('Common.submit')}
          modalText={t('ReviewPage.confirmationDescription')}
          modalTitle={t('ReviewPage.confirmationTitle')}
          cancelButtonProps={{ variant: 'secondary' }}
          contentProps={{ size: 'sm' }}
          titleUnderline
          disabled={isSubmitting || isValidating}
        >
          {isSubmitting 
            ? 'Submitting your application...' 
            : isValidating 
            ? 'Validating...' 
            : t('Common.submit')
          }
        </ModalButton>
      </div>
    </ActionBar>
  );
};
