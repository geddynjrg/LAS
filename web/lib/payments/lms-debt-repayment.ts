'use server';

import {
  getLmsGroupLoanStatus,
  sendLmsDebtReminderSms,
} from '@/lib/api/lms-loan-history.service';
import type { LmsDebtCheckResult } from '@/lib/api/lms-loan-history.types';
import { getCurrentUser } from '@/lib/data/application';
import {
  cancelStalePendingPayments,
  createPaymentTransaction,
  getActivePendingPayment,
  updatePaymentTransactionInvoice,
} from '@/lib/data/payment-transaction';
import { prisma } from '@/lib/db/prisma';
import {
  buildPesaflowCheckoutPayload,
  generateBillRefNumber,
  getPesaflowCheckoutUrl,
} from '@/lib/payments/pesaflow-checkout';
import {
  extractStoredInvoiceLink,
  requestPesaflowInvoice,
} from '@/lib/payments/pesaflow-invoice';
import { roundMoney } from '@/lib/payments/pesaflow-utils';
import { isPesaflowConfiguredFromEnv } from '@/lib/payments/pesaflow.config';
import type { PesaflowPaymentResult } from '@/lib/payments/pesaflow.types';

export interface LmsDebtRepaymentRequest {
  applicationId: string;
  groupLoanId: number;
  amount: number;
  outstandingBalance: number;
  minimumPaymentRequired: number;
  payerPhone?: string;
  payerEmail?: string;
  payerName?: string;
  payerIdNumber?: string;
}

function extractCheckoutMeta(checkoutPayload: unknown): {
  lmsGroupLoanId?: number;
  paymentType?: string;
} {
  if (!checkoutPayload || typeof checkoutPayload !== 'object') {
    return {};
  }

  const payload = checkoutPayload as Record<string, unknown>;
  const meta = payload._meta;

  if (!meta || typeof meta !== 'object') {
    return {};
  }

  const metaRecord = meta as Record<string, unknown>;

  return {
    lmsGroupLoanId:
      typeof metaRecord.lmsGroupLoanId === 'number'
        ? metaRecord.lmsGroupLoanId
        : undefined,
    paymentType:
      typeof metaRecord.paymentType === 'string'
        ? metaRecord.paymentType
        : undefined,
  };
}

export { extractCheckoutMeta };

export async function validateLmsDebtRepayment(
  request: LmsDebtRepaymentRequest,
): Promise<{ valid: boolean; error?: string; amount?: number }> {
  const amount = roundMoney(request.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, error: 'Enter a valid repayment amount' };
  }

  if (amount > request.outstandingBalance + 0.01) {
    return {
      valid: false,
      error: `Amount exceeds outstanding balance of KES ${request.outstandingBalance.toFixed(2)}`,
    };
  }

  const minimumRequired = roundMoney(request.minimumPaymentRequired);
  if (amount + 0.01 < minimumRequired) {
    return {
      valid: false,
      error: `Pay at least KES ${minimumRequired.toFixed(2)} (80% of the loan) or the full outstanding balance`,
    };
  }

  const liveStatus = await getLmsGroupLoanStatus(request.groupLoanId);
  if (liveStatus && liveStatus.can_proceed) {
    return {
      valid: false,
      error: 'This loan no longer blocks your application. You may continue.',
    };
  }

  return { valid: true, amount };
}

async function resolvePayerDetails(
  applicationId: string,
  request: LmsDebtRepaymentRequest,
) {
  const user = await getCurrentUser();

  const application = await prisma.application.findUnique({
    where: { applicationId },
    include: {
      user: true,
      members: { take: 1, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!application || application.userId !== user.id) {
    throw new Error('Application not found or access denied');
  }

  const member = application.members[0];

  const clientName =
    request.payerName || user.name || member?.fullname || 'Uwezo Applicant';

  const clientMSISDN =
    request.payerPhone || user.phoneNumber || member?.phoneNumber || '';

  const clientIDNumber =
    request.payerIdNumber || member?.nationalIdCode || '00000000';

  const clientEmail = request.payerEmail || user.email || 'noreply@uwezo.go.ke';

  if (!clientMSISDN) {
    throw new Error('A phone number is required to process M-Pesa payment');
  }

  return { clientName, clientMSISDN, clientIDNumber, clientEmail };
}

export async function initiateLmsDebtRepayment(
  request: LmsDebtRepaymentRequest,
): Promise<PesaflowPaymentResult> {
  if (!isPesaflowConfiguredFromEnv()) {
    return {
      success: false,
      configured: false,
      error:
        'Pesaflow payments are not enabled yet. Online repayment will be available soon.',
    };
  }

  const checkoutUrl = getPesaflowCheckoutUrl();
  if (!checkoutUrl) {
    return {
      success: false,
      configured: true,
      error: 'Pesaflow checkout URL is not configured.',
    };
  }

  try {
    const validation = await validateLmsDebtRepayment(request);
    if (!validation.valid) {
      return {
        success: false,
        configured: true,
        error: validation.error ?? 'Invalid repayment request',
      };
    }

    await cancelStalePendingPayments(request.applicationId);

    const pending = await getActivePendingPayment(request.applicationId);
    if (pending) {
      const checkoutPayload = pending.checkoutPayload as Record<
        string,
        unknown
      >;
      const invoiceLink =
        extractStoredInvoiceLink(pending.checkoutPayload) ?? undefined;

      return {
        success: false,
        configured: true,
        error:
          'You already have a payment in progress. Continue with your existing checkout or wait for it to expire.',
        paymentId: pending.id,
        invoiceLink,
        checkoutUrl,
        checkoutPayload: checkoutPayload as Record<string, string>,
        billRefNumber: pending.billRefNumber,
      };
    }

    const payer = await resolvePayerDetails(request.applicationId, request);
    const billRefNumber = generateBillRefNumber(request.applicationId);
    const amount = validation.amount ?? request.amount;

    const checkoutPayload = buildPesaflowCheckoutPayload({
      applicationId: request.applicationId,
      amount,
      billRefNumber,
      ...payer,
      billDesc: `Uwezo Fund loan repayment - ${request.applicationId}`,
    });

    if (!checkoutPayload) {
      return {
        success: false,
        configured: true,
        error: 'Failed to build Pesaflow checkout payload.',
      };
    }

    const payloadWithMeta = {
      ...checkoutPayload,
      _meta: {
        paymentType: 'lms_debt',
        lmsGroupLoanId: request.groupLoanId,
      },
    };

    const transaction = await createPaymentTransaction({
      applicationId: request.applicationId,
      billRefNumber,
      amountExpected: amount,
      ...payer,
      checkoutPayload: payloadWithMeta as typeof checkoutPayload,
    });

    const invoice = await requestPesaflowInvoice(checkoutUrl, checkoutPayload);

    await updatePaymentTransactionInvoice(transaction.id, {
      invoiceNumber: invoice.invoice_number,
      invoiceLink: invoice.invoice_link,
      checkoutPayload: {
        ...payloadWithMeta,
        _invoiceLink: invoice.invoice_link,
      } as typeof checkoutPayload,
    });

    void sendLmsDebtReminderSms({
      groupLoanId: request.groupLoanId,
      outstandingBalance: request.outstandingBalance,
      invoiceLink: invoice.invoice_link,
      applicationId: request.applicationId,
    }).catch((error) => {
      console.warn('[LMS debt repayment] Reminder SMS failed:', error);
    });

    return {
      success: true,
      paymentId: transaction.id,
      billRefNumber,
      invoiceNumber: invoice.invoice_number,
      invoiceLink: invoice.invoice_link,
      checkoutUrl,
      checkoutPayload: payloadWithMeta as unknown as Record<string, string>,
    };
  } catch (error) {
    console.error('[LMS debt repayment] initiate failed:', error);
    return {
      success: false,
      configured: true,
      error:
        error instanceof Error ? error.message : 'Failed to initiate payment',
    };
  }
}

export async function recheckLmsDebt(
  debt: LmsDebtCheckResult,
): Promise<LmsDebtCheckResult> {
  if (!debt.group_loan_id) {
    return debt;
  }

  const status = await getLmsGroupLoanStatus(debt.group_loan_id);
  if (!status) {
    return debt;
  }

  return {
    ...debt,
    has_debt: status.has_debt,
    can_proceed: status.can_proceed,
    outstanding_balance: status.outstanding_balance,
    repayment_percentage: status.repayment_percentage,
    minimum_payment_required: status.minimum_payment_required,
  };
}
