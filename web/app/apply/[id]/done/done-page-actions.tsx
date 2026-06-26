'use client';

import { IconAlertCircle, IconLoader2, IconMail } from '@tabler/icons-react';
import { Alert } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import { DataPair } from '@workspace/ui/components/data-pair';
// import { Label } from "@workspace/ui/components/label";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalTitle,
} from '@workspace/ui/components/modal';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState, useTransition } from 'react';

interface DonePageActionsProps {
  applicationId: string;
}

export function DonePageActions({ applicationId }: DonePageActionsProps) {
  const t = useTranslations();
  const [isPendingPdf, startPdfTransition] = useTransition();
  const [isPendingEmail, startEmailTransition] = useTransition();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [userHasEmail, setUserHasEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const profile = (await response.json()) as {
          data?: { email?: string };
        };
        setUserHasEmail(Boolean(profile.data?.email));
      })
      .catch(() => {
        setUserHasEmail(false);
      });
  }, []);

  const handleDownloadPdf = () => {
    startPdfTransition(async () => {
      try {
        setError(null);

        const response = await fetch(
          `/api/applications/${encodeURIComponent(applicationId)}/pdf`,
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(
            payload?.error || t('ApplyPage.DonePage.errors.download-failed'),
          );
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Application-${applicationId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccessMessage(t('ApplyPage.DonePage.download-success'));
      } catch (error) {
        console.error('Error downloading PDF:', error);
        setError(t('ApplyPage.DonePage.errors.download-failed'));
      }
    });
  };

  const handleSendEmail = (email?: string) => {
    startEmailTransition(async () => {
      try {
        setError(null);
        setSuccessMessage(null);

        const response = await fetch(
          `/api/applications/${encodeURIComponent(applicationId)}/email`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(email ? { email } : {}),
          },
        );

        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          message?: string;
          error?: string;
        } | null;

        if (response.ok && payload?.success) {
          setSuccessMessage(
            payload.message || t('ApplyPage.DonePage.email.success'),
          );
          setIsEmailModalOpen(false);
          setEmailInput('');
        } else {
          setError(
            payload?.error || t('ApplyPage.DonePage.errors.email-failed'),
          );
        }
      } catch (error) {
        console.error('Error sending email:', error);
        setError(t('ApplyPage.DonePage.errors.email-failed'));
      }
    });
  };

  const handleEmailButtonClick = () => {
    if (userHasEmail) {
      // User has email, send directly
      handleSendEmail();
    } else {
      // User doesn't have email, show modal
      setIsEmailModalOpen(true);
      setError(null);
      setSuccessMessage(null);
      setIsEmailValid(null);
      // Auto-focus the input after modal opens
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailInput(value);
    setError(null); // Clear any previous errors

    if (value.trim() === '') {
      setIsEmailValid(null);
    } else {
      setIsEmailValid(validateEmail(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && emailInput.trim() && isEmailValid) {
      e.preventDefault();
      handleModalEmailSubmit();
    }
  };

  const handleModalEmailSubmit = () => {
    if (!emailInput.trim()) {
      setError(t('ApplyPage.DonePage.errors.email-required'));
      emailInputRef.current?.focus();
      return;
    }

    if (!validateEmail(emailInput)) {
      setError(t('ApplyPage.DonePage.errors.invalid-email'));
      emailInputRef.current?.focus();
      return;
    }

    handleSendEmail(emailInput);
  };

  return (
    <>
      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      {/* Action Buttons */}
      <DataPair className={cn('flex w-full flex-row gap-2')}>
        <Button
          className={cn('grow', 'w-full max-w-[27rem] px-2')}
          variant="secondary"
          onClick={handleDownloadPdf}
          disabled={isPendingPdf}
        >
          {isPendingPdf
            ? t('ApplyPage.DonePage.downloading')
            : t('ApplyPage.DonePage.download-application')}
        </Button>

        <Button
          className={cn('grow', 'w-full max-w-[27rem] whitespace-nowrap px-2')}
          variant="secondary"
          onClick={handleEmailButtonClick}
          disabled={isPendingEmail}
        >
          {isPendingEmail
            ? t('ApplyPage.DonePage.sending')
            : t('ApplyPage.DonePage.send-to-email')}
        </Button>
      </DataPair>

      {/* Email Input Modal */}
      <Modal open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <ModalContent showClose={false} size="md">
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
              <IconMail className="text-primary h-6 w-6" />
            </div>
            <div>
              <ModalTitle className="typo-h3 mb-1">
                {t('ApplyPage.DonePage.modal.title')}
              </ModalTitle>
              <p className="text-sm text-neutral-600">
                {t('ApplyPage.DonePage.modal.description')}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {/* <Label htmlFor="email-input" className="text-sm font-medium">
              {t("ApplyPage.DonePage.modal.email-label")}
            </Label> */}

            <div className="relative">
              <input
                ref={emailInputRef}
                id="email-input"
                type="email"
                value={emailInput}
                onChange={handleEmailInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t('ApplyPage.DonePage.modal.email-placeholder')}
                className={`w-full rounded-md border px-3 py-2 pr-10 transition-colors ${
                  isEmailValid === false
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : isEmailValid === true
                      ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                      : 'focus:border-primary focus:ring-primary/20 border-neutral-300 focus:ring-2'
                } focus:outline-none`}
                autoComplete="email"
                aria-describedby={error ? 'email-error' : undefined}
              />

              {/* Validation Icon */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isEmailValid === true && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                {isEmailValid === false && (
                  <IconAlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            {/* Inline Error Display */}
            {error && (
              <div
                id="email-error"
                className="flex items-center gap-2 text-sm text-red-600"
              >
                <IconAlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Success hint when email is valid */}
            {isEmailValid === true && !error && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                  <svg
                    className="h-2.5 w-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {t('ApplyPage.DonePage.modal.valid-email')}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-4">
            <div className="mb-4 text-xs text-neutral-500">
              {t('ApplyPage.DonePage.modal.privacy-note')}
            </div>

            <ModalFooter className="gap-3 p-0">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEmailModalOpen(false);
                  setEmailInput('');
                  setError(null);
                  setIsEmailValid(null);
                }}
                disabled={isPendingEmail}
                className="flex-1"
              >
                {t('ApplyPage.DonePage.modal.cancel')}
              </Button>
              <Button
                onClick={handleModalEmailSubmit}
                disabled={
                  isPendingEmail || !emailInput.trim() || isEmailValid !== true
                }
                className="flex flex-1 items-center justify-center gap-2"
              >
                {isPendingEmail && (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                )}
                {isPendingEmail
                  ? t('ApplyPage.DonePage.sending')
                  : t('ApplyPage.DonePage.modal.send')}
              </Button>
            </ModalFooter>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
