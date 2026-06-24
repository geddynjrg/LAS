'use server';

import {
  cancelStalePendingPayments,
  getActivePendingPayment,
} from '@/lib/data/payment-transaction';
import { prisma } from '@/lib/db/prisma';
import { getPesaflowCheckoutUrl } from '@/lib/payments/pesaflow-checkout';
import { extractStoredInvoiceLink } from '@/lib/payments/pesaflow-invoice';
import { getRepaymentSummary } from '@/lib/payments/pesaflow-repayment';
import {
  isRepaymentEligibleStatus,
  roundMoney,
} from '@/lib/payments/pesaflow-utils';
import type {
  PesaflowCheckoutPayload,
  PesaflowPaymentRequest,
} from '@/lib/payments/pesaflow.types';

export interface RepaymentValidationResult {
  valid: boolean;
  error?: string;
  amount?: number;
  resumePaymentId?: string;
  resumeInvoiceLink?: string;
  resumeCheckoutUrl?: string;
  resumeCheckoutPayload?: Record<string, string>;
}

export async function validateRepaymentRequest(
  request: PesaflowPaymentRequest,
): Promise<RepaymentValidationResult> {
  const summary = await getRepaymentSummary(request.applicationId);

  if (!summary) {
    return { valid: false, error: 'Application not found or access denied' };
  }

  const application = await prisma.application.findUnique({
    where: { applicationId: request.applicationId },
    select: { status: true },
  });

  if (!application || !isRepaymentEligibleStatus(application.status)) {
    return {
      valid: false,
      error:
        'Online repayment is only available after the loan has been disbursed',
    };
  }

  if (summary.outstandingBalance <= 0) {
    return {
      valid: false,
      error: 'This loan has no outstanding balance to repay',
    };
  }

  await cancelStalePendingPayments(request.applicationId);

  const pending = await getActivePendingPayment(request.applicationId);
  if (pending) {
    const checkoutUrl = getPesaflowCheckoutUrl() ?? undefined;
    const checkoutPayload =
      pending.checkoutPayload as unknown as PesaflowCheckoutPayload;
    const invoiceLink =
      extractStoredInvoiceLink(pending.checkoutPayload) ?? undefined;

    return {
      valid: false,
      error:
        'You already have a payment in progress. Continue with your existing checkout or wait for it to expire.',
      resumePaymentId: pending.id,
      resumeInvoiceLink: invoiceLink,
      resumeCheckoutUrl: checkoutUrl,
      resumeCheckoutPayload: checkoutPayload as unknown as Record<
        string,
        string
      >,
    };
  }

  const amount = roundMoney(request.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, error: 'Enter a valid repayment amount' };
  }

  if (amount > summary.outstandingBalance + 0.01) {
    return {
      valid: false,
      error: `Amount exceeds outstanding balance of KES ${summary.outstandingBalance.toFixed(2)}`,
    };
  }

  return { valid: true, amount };
}
