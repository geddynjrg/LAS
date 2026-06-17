'use client';

import { PesaflowIframeCheckout } from '@/components/pesaflow-iframe-checkout';
import type { LmsDebtCheckResult } from '@/lib/api/lms-loan-history.types';
import {
  initiateLmsDebtRepayment,
  recheckLmsDebt,
} from '@/lib/payments/lms-debt-repayment';
import {
  getPaymentCheckoutSession,
  isPesaflowConfigured,
} from '@/lib/payments/pesaflow.service';
import { Button } from '@workspace/ui/components/button';
import { Currency } from '@workspace/ui/components/currency';
import { Input } from '@workspace/ui/components/input';
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalTitle,
} from '@workspace/ui/components/modal';
import { type FC, useCallback, useEffect, useState } from 'react';

interface OutstandingDebtModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  debt: LmsDebtCheckResult;
  onDebtCleared: () => void;
  checkLabel?: string;
}

type ModalStep = 'summary' | 'checkout';

interface CheckoutView {
  invoiceLink?: string;
  checkoutUrl?: string;
  checkoutPayload?: Record<string, string>;
  billRefNumber?: string;
  invoiceNumber?: string;
}

export const OutstandingDebtModal: FC<OutstandingDebtModalProps> = ({
  open,
  onOpenChange,
  applicationId,
  debt,
  onDebtCleared,
  checkLabel,
}) => {
  const [step, setStep] = useState<ModalStep>('summary');
  const [currentDebt, setCurrentDebt] = useState(debt);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [checkoutView, setCheckoutView] = useState<CheckoutView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);

  useEffect(() => {
    setCurrentDebt(debt);
  }, [debt]);

  useEffect(() => {
    isPesaflowConfigured()
      .then(setPaymentsEnabled)
      .catch(() => setPaymentsEnabled(false));
  }, []);

  useEffect(() => {
    if (!open) {
      setStep('summary');
      setCheckoutView(null);
      setError(null);
      return;
    }

    const defaultAmount = Math.max(
      currentDebt.minimum_payment_required,
      currentDebt.outstanding_balance,
    );
    setPaymentAmount(defaultAmount.toFixed(2));
  }, [
    open,
    currentDebt.minimum_payment_required,
    currentDebt.outstanding_balance,
  ]);

  const handleRecheck = useCallback(async () => {
    setIsRechecking(true);
    setError(null);

    try {
      const updated = await recheckLmsDebt(currentDebt);
      setCurrentDebt(updated);

      if (updated.can_proceed) {
        onDebtCleared();
        onOpenChange(false);
      }
    } catch {
      setError('Could not verify repayment status. Please try again.');
    } finally {
      setIsRechecking(false);
    }
  }, [currentDebt, onDebtCleared, onOpenChange]);

  const parsePaymentAmount = () => {
    const amount = Number.parseFloat(paymentAmount.replace(/,/g, ''));
    return Number.isFinite(amount) ? amount : NaN;
  };

  const handleProceedToPayment = async () => {
    if (!currentDebt.group_loan_id) {
      setError('Loan reference is missing. Please contact support.');
      return;
    }

    const amount = parsePaymentAmount();
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid repayment amount.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await initiateLmsDebtRepayment({
        applicationId,
        groupLoanId: currentDebt.group_loan_id,
        amount,
        outstandingBalance: currentDebt.outstanding_balance,
        minimumPaymentRequired: currentDebt.minimum_payment_required,
      });

      if (
        result.invoiceLink ||
        (result.checkoutUrl && result.checkoutPayload)
      ) {
        setCheckoutView({
          invoiceLink: result.invoiceLink,
          checkoutUrl: result.checkoutUrl,
          checkoutPayload: result.checkoutPayload,
          billRefNumber: result.billRefNumber,
          invoiceNumber: result.invoiceNumber,
        });
        setStep('checkout');
        return;
      }

      if (result.paymentId) {
        const session = await getPaymentCheckoutSession(result.paymentId);
        if (session) {
          setCheckoutView({
            invoiceLink: session.invoiceLink ?? undefined,
            checkoutUrl: session.checkoutUrl,
            checkoutPayload: session.payload,
            billRefNumber: session.billRefNumber,
            invoiceNumber: session.invoiceNumber ?? undefined,
          });
          setStep('checkout');
          return;
        }
      }

      setError(result.error ?? 'Unable to start Pesaflow checkout.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Payment initiation failed.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const modalSize = step === 'checkout' ? 'lg' : 'md';

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size={modalSize} className="max-h-[90vh] overflow-y-auto">
        <ModalTitle className="border-b border-neutral-300 pb-4">
          Outstanding Uwezo Fund loan
        </ModalTitle>

        {step === 'summary' ? (
          <>
            <div className="space-y-4 py-4">
              <p className="text-neutral-700">
                {checkLabel ??
                  'This group has an existing Uwezo Fund loan that must be repaid before you can continue with this application.'}
              </p>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Repay at least{' '}
                <strong>
                  KES{' '}
                  {currentDebt.minimum_payment_required.toLocaleString('en-KE')}
                </strong>{' '}
                (80% of the loan) or the full outstanding balance via Pesaflow
                before proceeding.
              </div>

              <div className="grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Group</span>
                  <span className="font-medium text-right">
                    {currentDebt.group_name ?? 'N/A'}
                  </span>
                </div>
                {currentDebt.group_registration_number ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-600">Certificate no.</span>
                    <span className="font-medium">
                      {currentDebt.group_registration_number}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Amount owed</span>
                  <Currency
                    amount={currentDebt.outstanding_balance}
                    currency="KES"
                  />
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Repaid so far</span>
                  <span>
                    {currentDebt.repayment_percentage.toFixed(1)}% (
                    <Currency
                      amount={currentDebt.amount_repaid}
                      currency="KES"
                    />
                    )
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Application ref</span>
                  <span className="font-mono text-xs">{applicationId}</span>
                </div>
              </div>

              {paymentsEnabled ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-800">
                    Repayment amount (KES)
                  </label>
                  <Input
                    value={paymentAmount}
                    onValueChange={setPaymentAmount}
                    endDecorator="KSh"
                    type="text"
                  />
                  <p className="text-xs text-neutral-500">
                    Minimum to continue: KES{' '}
                    {currentDebt.minimum_payment_required.toLocaleString(
                      'en-KE',
                    )}{' '}
                    · Full balance: KES{' '}
                    {currentDebt.outstanding_balance.toLocaleString('en-KE')}
                  </p>
                </div>
              ) : (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Online repayment is temporarily unavailable. Please contact
                  your constituency office.
                </p>
              )}

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
            </div>

            <ModalFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleRecheck()}
                disabled={isRechecking}
              >
                {isRechecking ? 'Checking…' : 'I have repaid — verify'}
              </Button>
              {paymentsEnabled ? (
                <Button
                  type="button"
                  onClick={() => void handleProceedToPayment()}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Starting checkout…' : 'Pay via Pesaflow'}
                </Button>
              ) : null}
            </ModalFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 py-4">
              <p className="text-sm text-neutral-600">
                Complete your payment below. After paying, click &quot;Verify
                repayment&quot; to continue your application.
              </p>

              {(checkoutView?.billRefNumber || checkoutView?.invoiceNumber) && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                  {checkoutView.billRefNumber ? (
                    <p>
                      <span className="text-neutral-500">Bill reference:</span>{' '}
                      {checkoutView.billRefNumber}
                    </p>
                  ) : null}
                  {checkoutView.invoiceNumber ? (
                    <p className="mt-1">
                      <span className="text-neutral-500">Invoice number:</span>{' '}
                      {checkoutView.invoiceNumber}
                    </p>
                  ) : null}
                  <p className="mt-1">
                    <span className="text-neutral-500">Application:</span>{' '}
                    {applicationId}
                  </p>
                </div>
              )}

              <PesaflowIframeCheckout
                invoiceLink={checkoutView?.invoiceLink}
                checkoutUrl={checkoutView?.checkoutUrl}
                fields={checkoutView?.checkoutPayload}
              />

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
            </div>

            <ModalFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep('summary')}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => void handleRecheck()}
                disabled={isRechecking}
              >
                {isRechecking ? 'Verifying…' : 'Verify repayment'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
