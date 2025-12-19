'use client';

import { updateApplicationStatusById } from '@/app/apply/[id]/review/update-application-status-by-id-action';
import { validateApplicationForSubmission } from '@/lib/validation/application-validation';
import { ApplicationStatus } from '@/generated/prisma';
import { syncApplication } from '@/lib/api/sync.service';
import { ActionBar } from '@workspace/ui/components/action-bar';
import { Button } from '@workspace/ui/components/button';
import { ModalButton } from '@workspace/ui/components/modal-button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { type FC, useState } from 'react';
import { getApplicationById } from '@/lib/data/application';
import type { ApplicationData } from '@/lib/types/application.types';
import { IconArrowLeft, IconAlertCircle, IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react';
import { Modal, ModalClose, ModalContent, ModalFooter, ModalTitle, ModalTrigger } from '@workspace/ui/components/modal';

export interface ReviewDataProps {
  id: string;
}

export const ReviewFooter: FC<ReviewDataProps> = ({ id }) => {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Modal states
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationMissingFields, setValidationMissingFields] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  

  // const handleSubmit = async () => {
  //   try {
  //     setIsValidating(true);

  //     // Fetch the latest application data - this returns ApplicationData
  //     const application: ApplicationData | undefined = await getApplicationById(id);
      
  //     if (!application) {
  //       throw new Error('Application not found');
  //     }

  //     // Validate the application using ApplicationData type
  //     const validation = validateApplicationForSubmission(application);
      
  //     if (!validation.isValid) {
  //       setIsValidating(false);
        
  //       // Set validation data for modal
  //       setValidationErrors(validation.errors);
  //       setValidationMissingFields(validation.missingFields);
  //       setValidationWarnings(validation.warnings);
  //       setShowValidationModal(true);
  //       return;
  //     }

  //     // if (!validation.isValid) {
  //     //   // Create a detailed error message
  //     //   let errorMessage = 'Cannot submit application. Please fix the following issues:\n\n';
        
  //     //   // Show critical errors first
  //     //   if (validation.errors.length > 0) {
  //     //     errorMessage += '❌ Critical Issues:\n';
  //     //     validation.errors.forEach(error => {
  //     //       errorMessage += `• ${error}\n`;
  //     //     });
  //     //     errorMessage += '\n';
  //     //   }

  //     //   // Show missing fields
  //     //   if (validation.missingFields.length > 0) {
  //     //     errorMessage += '📝 Missing Required Information:\n';
  //     //     validation.missingFields.forEach(field => {
  //     //       errorMessage += `• ${field}\n`;
  //     //     });
  //     //     errorMessage += '\n';
  //     //   }

  //     //   // Show warnings
  //     //   if (validation.warnings.length > 0) {
  //     //     errorMessage += '⚠️  Warnings:\n';
  //     //     validation.warnings.forEach(warning => {
  //     //       errorMessage += `• ${warning}\n`;
  //     //     });
  //     //   }

  //     //   // Add guidance
  //     //   errorMessage += '\nPlease complete all required steps before submitting.';

  //     //   alert(errorMessage);
  //     //   return;
  //     // }

  //     // If validation passes, show final confirmation
  //     const finalConfirmation = confirm(
  //       'Are you sure you want to submit your application?\n\n' +
  //       '✅ All required information is complete\n' +
  //       '✅ All members have responded\n' +
  //       '✅ 75% of members have consented\n' +
  //       '✅ All declarations are confirmed\n\n' +
  //       'Once submitted, you cannot make changes to the application.'
  //     );

  //     if (!finalConfirmation) {
  //       return;
  //     }

  //     // Proceed with submission
  //     setIsSubmitting(true);

  //     console.log('[SUBMIT] Validated application, proceeding with submission for:', id);

  //     // Step 1: Update application status
  //     const result = await updateApplicationStatusById(
  //       id,
  //       ApplicationStatus.SUBMITTED,
  //     );
  //     console.log('[SUBMIT] Status update result:', result);

  //     // Step 2: Sync to Drupal immediately
  //     console.log('[SUBMIT] Syncing application to Drupal...');
  //     const syncResult = await syncApplication(id, true);

  //     if (!syncResult.success) {
  //       throw new Error(
  //         syncResult.error || 'Failed to sync application to Drupal',
  //       );
  //     }

  //     // Step 3: Navigate to done page only after successful sync
  //     router.push(`/apply/${id}/done`);
  //   } catch (error) {
  //     console.error('[SUBMIT] Error submitting application:', error);
  //     setIsSubmitting(false);
  //     setIsValidating(false);

  //     alert(
  //       `Error submitting application: ${error instanceof Error ? error.message : 'Unknown error'}.\n\nPlease try again or contact support if the problem persists.`,
  //     );
  //   }
  // };

  const handleSubmit = async () => {
    try {
      setIsValidating(true);

      // Fetch the latest application data
      const application: ApplicationData | undefined = await getApplicationById(id);
      
      if (!application) {
        throw new Error('Application not found');
      }

      // Validate the application
      const validation = validateApplicationForSubmission(application);
      
      if (!validation.isValid) {
        setIsValidating(false);
        
        // Set validation data for modal
        setValidationErrors(validation.errors);
        setValidationMissingFields(validation.missingFields);
        setValidationWarnings(validation.warnings);
        setShowValidationModal(true);
        return;
      }

      // If validation passes, show final confirmation modal
      setIsValidating(false);
      setShowConfirmationModal(true);

    } catch (error) {
      console.error('[VALIDATION] Error:', error);
      setIsValidating(false);
      
      // Show error modal
      setValidationErrors([error instanceof Error ? error.message : 'Unknown error']);
      setValidationMissingFields([]);
      setValidationWarnings([]);
      setShowValidationModal(true);
    }
  };

  const handleFinalConfirmation = async () => {
    setShowConfirmationModal(false);
    
    try {
      setIsSubmitting(true);

      console.log('[SUBMIT] Proceeding with submission for:', id);

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

      // Show submission error modal
      setValidationErrors([error instanceof Error ? error.message : 'Unknown error']);
      setValidationMissingFields([]);
      setValidationWarnings([]);
      setShowValidationModal(true);
    }
  };

   return (
    <>
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

      {/* Validation Error Modal */}
      <Modal open={showValidationModal} onOpenChange={setShowValidationModal}>
        <ModalContent size="lg">
          <ModalTitle className="border-b border-neutral-300 pb-4">
            {validationErrors.length > 0 ? 'Cannot Submit Application' : 'Validation Error'}
          </ModalTitle>
          
          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
            {validationErrors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-red-700 flex items-center gap-2">
                  <IconX className="h-5 w-5" />
                  Critical Issues
                </h4>
                <ul className="space-y-2 text-red-600">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationMissingFields.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-amber-700 flex items-center gap-2">
                  <IconAlertCircle className="h-5 w-5" />
                  Missing Required Information
                </h4>
                <ul className="space-y-2 text-amber-600">
                  {validationMissingFields.map((field, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{field}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                  <IconInfoCircle className="h-5 w-5" />
                  Warnings
                </h4>
                <ul className="space-y-2 text-blue-600">
                  {validationWarnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validationErrors.length === 0 && validationMissingFields.length === 0 && validationWarnings.length === 0 ? (
              <div className="space-y-3">
                <p className="text-red-600">
                  An error occurred while validating your application.
                </p>
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <p className="font-medium">Please try again or contact support if the problem persists.</p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Please complete all required steps before submitting your application.
                  You can use the navigation above to go back and fix any issues.
                </p>
              </div>
            )}
          </div>

          <ModalFooter>
            <ModalClose asChild>
              <Button variant="secondary">
                {t('Common.back')}
              </Button>
            </ModalClose>
            <ModalClose asChild>
              <Button>
                {t('Common.close')}
              </Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Final Confirmation Modal */}
      <Modal open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <ModalContent size="md">
          <ModalTitle className="border-b border-neutral-300 pb-4">
            Submit Application
          </ModalTitle>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <IconCheck className="h-5 w-5" />
                <span className="font-medium">All required information is complete</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <IconCheck className="h-5 w-5" />
                <span className="font-medium">75% of members have consented</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <IconCheck className="h-5 w-5" />
                <span className="font-medium">All declarations are confirmed</span>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> Once submitted, you cannot make changes to the application.
                Please ensure all information is correct before proceeding.
              </p>
            </div>
            
            <p className="text-gray-600 text-sm">
              Are you sure you want to submit your application?
            </p>
          </div>

          <ModalFooter>
            <ModalClose asChild>
              <Button variant="secondary">
                {t('Common.back')}
              </Button>
            </ModalClose>
            <Button onClick={handleFinalConfirmation} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></span>
                  Submitting...
                </>
              ) : (
                t('Common.submit')
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};