'use client';

import {
  getPaymentCheckoutSession,
  getRepaymentSummary,
  initiatePesaflowRepayment,
  isPesaflowConfigured,
} from '@/lib/payments/pesaflow.service';
import { PesaflowIframeCheckout } from '@/components/pesaflow-iframe-checkout';
import { IconCreditCard } from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
import { Currency } from '@workspace/ui/components/currency';
import { Input } from '@workspace/ui/components/input';
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
} from '@workspace/ui/components/modal';
import { useTranslations } from 'next-intl';
import { type FC, useEffect, useState } from 'react';

interface LoanRepayModalProps {
  applicationId: string;
  loanAmount: number;
  repaymentPeriod?: number;
}

type ModalStep = 'amount' | 'checkout';

interface CheckoutView {
  invoiceLink?: string;
  checkoutUrl?: string;
  checkoutPayload?: Record<string, string>;
  billRefNumber?: string;
}

export const LoanRepayModal: FC<LoanRepayModalProps> = ({
  applicationId,
  loanAmount,
  repaymentPeriod,
}) => {
  const t = useTranslations('DashboardPage.repay');
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ModalStep>('amount');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(loanAmount);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [checkoutView, setCheckoutView] = useState<CheckoutView | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    isPesaflowConfigured()
      .then(setPaymentsEnabled)
      .catch(() => setPaymentsEnabled(false));
  }, []);

  useEffect(() => {
    if (!open) {
      setStep('amount');
      setCheckoutView(null);
      setError(null);
      setPendingPaymentId(null);
      return;
    }

    if (!paymentsEnabled) {
      return;
    }

    setIsLoadingSummary(true);
    setError(null);

    getRepaymentSummary(applicationId)
      .then((summary) => {
        if (!summary) {
          setError(t('paymentUnavailable'));
          return;
        }

        setTotalPaid(summary.totalPaid);
        setOutstandingBalance(summary.outstandingBalance);
        setPaymentAmount(summary.outstandingBalance.toFixed(2));
        setPendingPaymentId(summary.pendingPaymentId ?? null);
      })
      .catch(() => {
        setOutstandingBalance(loanAmount);
        setTotalPaid(0);
        setPaymentAmount(loanAmount.toFixed(2));
      })
      .finally(() => setIsLoadingSummary(false));
  }, [applicationId, loanAmount, open, paymentsEnabled, t]);

  const loadCheckoutView = async (paymentId: string) => {
    const session = await getPaymentCheckoutSession(paymentId);
    if (!session) {
      setError(t('paymentUnavailable'));
      return false;
    }

    setCheckoutView({
      invoiceLink: session.invoiceLink ?? undefined,
      checkoutUrl: session.checkoutUrl,
      checkoutPayload: session.payload,
      billRefNumber: session.billRefNumber,
    });
    setStep('checkout');
    return true;
  };

  const parsePaymentAmount = () => {
    const amount = Number.parseFloat(paymentAmount.replace(/,/g, ''));
    return Number.isFinite(amount) ? amount : NaN;
  };

  const handleContinuePending = async () => {
    if (!pendingPaymentId) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const loaded = await loadCheckoutView(pendingPaymentId);
      if (!loaded) {
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('paymentUnavailable'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepay = async () => {
    if (!paymentsEnabled || outstandingBalance <= 0) {
      return;
    }

    const amount = parsePaymentAmount();
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t('invalidAmount'));
      return;
    }

    if (amount > outstandingBalance + 0.01) {
      setError(
        t('amountExceedsBalance', {
          amount: outstandingBalance.toFixed(2),
        }),
      );
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await initiatePesaflowRepayment({
        applicationId,
        amount,
        currency: 'KES',
        description: `Loan repayment for ${applicationId}`,
      });

      if (result.invoiceLink || (result.checkoutUrl && result.checkoutPayload)) {
        setCheckoutView({
          invoiceLink: result.invoiceLink,
          checkoutUrl: result.checkoutUrl,
          checkoutPayload: result.checkoutPayload,
          billRefNumber: result.billRefNumber,
        });
        setStep('checkout');
        return;
      }

      if (result.paymentId && result.invoiceLink === undefined) {
        const loaded = await loadCheckoutView(result.paymentId);
        if (loaded) {
          return;
        }
      }

      if (!result.success) {
        if (result.configured === false) {
          return;
        }

        if (result.paymentId) {
          setPendingPaymentId(result.paymentId);
        }

        setError(result.error || t('paymentUnavailable'));
        return;
      }

      setError(t('paymentUnavailable'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('paymentUnavailable'));
    } finally {
      setIsProcessing(false);
    }
  };

  const fullyPaid = outstandingBalance <= 0;
  const modalSize = step === 'checkout' ? 'lg' : 'md';

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button className="w-full">
          <IconCreditCard className="mr-2 h-4 w-4" />
          {t('repayButton')}
        </Button>
      </ModalTrigger>
      <ModalContent size={modalSize}>
        <ModalTitle className="border-b border-neutral-300 pb-4">
          {step === 'checkout' ? t('checkoutTitle') : t('modalTitle')}
        </ModalTitle>

        {step === 'amount' ? (
          <>
            <div className="space-y-4 py-4">
              <p className="text-neutral-700">{t('modalDescription')}</p>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm text-neutral-600">{t('outstandingBalance')}</p>
                <p className="typo-h3 mt-1">
                  <Currency amount={outstandingBalance} currency="KES" />
                </p>
                {totalPaid > 0 ? (
                  <p className="mt-2 text-sm text-neutral-600">
                    {t('paidSoFar')}{' '}
                    <Currency amount={totalPaid} currency="KES" />
                  </p>
                ) : null}
                {repaymentPeriod ? (
                  <p className="mt-2 text-sm text-neutral-600">
                    {t('repaymentPeriod', { months: repaymentPeriod })}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-neutral-600">
                  {t('originalLoan')}{' '}
                  <Currency amount={loanAmount} currency="KES" />
                </p>
              </div>

              {paymentsEnabled && !fullyPaid ? (
                <div>
                  <label
                    htmlFor="repayment-amount"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    {t('amountToPay')}
                  </label>
                  <Input
                    id="repayment-amount"
                    type="number"
                    value={paymentAmount}
                    disabled={isLoadingSummary || isProcessing}
                    onValueChange={setPaymentAmount}
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    {t('amountHint')}
                  </p>
                </div>
              ) : null}

              {!paymentsEnabled ? (
                <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  {t('paymentsComingSoon')}
                </p>
              ) : null}

              {paymentsEnabled && fullyPaid && !isLoadingSummary ? (
                <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {t('fullyRepaid')}
                </p>
              ) : null}

              {pendingPaymentId ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {t('pendingPayment')}
                </p>
              ) : null}

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {paymentsEnabled ? (
                <p className="text-xs text-neutral-500">{t('pesaflowNote')}</p>
              ) : null}
            </div>

            <ModalFooter>
              <ModalClose asChild>
                <Button variant="secondary">{t('cancel')}</Button>
              </ModalClose>
              {pendingPaymentId ? (
                <Button
                  onClick={handleContinuePending}
                  disabled={isProcessing || isLoadingSummary || !paymentsEnabled}
                >
                  {isProcessing ? t('processing') : t('continuePayment')}
                </Button>
              ) : (
                <Button
                  onClick={handleRepay}
                  disabled={
                    isProcessing ||
                    isLoadingSummary ||
                    !paymentsEnabled ||
                    fullyPaid
                  }
                >
                  {isProcessing ? t('processing') : t('proceedToPay')}
                </Button>
              )}
            </ModalFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {checkoutView?.billRefNumber ? (
                <p className="text-sm text-neutral-600">
                  {t('invoiceReference', {
                    reference: checkoutView.billRefNumber,
                  })}
                </p>
              ) : null}
              <PesaflowIframeCheckout
                invoiceLink={checkoutView?.invoiceLink}
                checkoutUrl={checkoutView?.checkoutUrl}
                fields={checkoutView?.checkoutPayload}
              />
              <p className="text-xs text-neutral-500">{t('checkoutNote')}</p>
            </div>
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setStep('amount');
                  setCheckoutView(null);
                }}
              >
                {t('back')}
              </Button>
              <ModalClose asChild>
                <Button>{t('close')}</Button>
              </ModalClose>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
