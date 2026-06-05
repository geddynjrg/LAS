'use server';

import { getCurrentUser } from '@/lib/data/application';
import { createPaymentTransaction, updatePaymentTransactionInvoice } from '@/lib/data/payment-transaction';
import { prisma } from '@/lib/db/prisma';
import { sendPaymentSuccessNotificationSMS } from '@/lib/api/payment-success-sms.service';
import {
  buildPesaflowCheckoutPayload,
  generateBillRefNumber,
  getPesaflowCheckoutUrl,
} from '@/lib/payments/pesaflow-checkout';
import { isPesaflowConfiguredFromEnv } from '@/lib/payments/pesaflow.config';
import {
  confirmPaymentByBillRef,
  handlePesaflowIpn,
  processPesaflowPaymentConfirmation,
} from '@/lib/payments/pesaflow-ipn';
import {
  extractStoredInvoiceLink,
  requestPesaflowInvoice,
} from '@/lib/payments/pesaflow-invoice';
import { getRepaymentSummary } from '@/lib/payments/pesaflow-repayment';
import { validateRepaymentRequest } from '@/lib/payments/pesaflow-validation';
import type {
  PesaflowPaymentRequest,
  PesaflowPaymentResult,
} from '@/lib/payments/pesaflow.types';

export async function isPesaflowConfigured(): Promise<boolean> {
  return isPesaflowConfiguredFromEnv();
}

export { getRepaymentSummary };

export async function notifyMembersOfSuccessfulPayment(
  applicationId: string,
  amount: number,
  billRefNumber?: string,
) {
  return sendPaymentSuccessNotificationSMS(applicationId, amount, billRefNumber);
}

export { handlePesaflowIpn, confirmPaymentByBillRef, processPesaflowPaymentConfirmation };

async function resolvePayerDetails(
  applicationId: string,
  request: PesaflowPaymentRequest,
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
    request.payerName ||
    user.name ||
    member?.fullname ||
    'Uwezo Applicant';

  const clientMSISDN =
    request.payerPhone ||
    user.phoneNumber ||
    member?.phoneNumber ||
    '';

  const clientIDNumber = request.payerIdNumber || member?.nationalIdCode || '00000000';

  const clientEmail =
    request.payerEmail || user.email || 'noreply@uwezo.go.ke';

  if (!clientMSISDN) {
    throw new Error('A phone number is required to process M-Pesa payment');
  }

  return { clientName, clientMSISDN, clientIDNumber, clientEmail };
}

export async function initiatePesaflowRepayment(
  request: PesaflowPaymentRequest,
): Promise<PesaflowPaymentResult> {
  if (!isPesaflowConfiguredFromEnv()) {
    return {
      success: false,
      configured: false,
      error:
        'Pesaflow payments are not enabled yet. Online repayment will be available soon.',
    };
  }

  if (!getPesaflowCheckoutUrl()) {
    return {
      success: false,
      configured: true,
      error: 'Pesaflow checkout URL is not configured.',
    };
  }

  try {
    const validation = await validateRepaymentRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        configured: true,
        error: validation.error ?? 'Invalid repayment request',
        paymentId: validation.resumePaymentId,
        invoiceLink: validation.resumeInvoiceLink,
        checkoutUrl: validation.resumeCheckoutUrl,
        checkoutPayload: validation.resumeCheckoutPayload,
      };
    }

    const payer = await resolvePayerDetails(request.applicationId, request);
    const billRefNumber = generateBillRefNumber(request.applicationId);
    const amount = validation.amount ?? request.amount;
    const checkoutUrl = getPesaflowCheckoutUrl();

    if (!checkoutUrl) {
      return {
        success: false,
        configured: true,
        error: 'Pesaflow checkout URL is not configured.',
      };
    }

    const checkoutPayload = buildPesaflowCheckoutPayload({
      applicationId: request.applicationId,
      amount,
      billRefNumber,
      ...payer,
      billDesc: request.description,
    });

    if (!checkoutPayload) {
      return {
        success: false,
        configured: true,
        error: 'Failed to build Pesaflow checkout payload.',
      };
    }

    const transaction = await createPaymentTransaction({
      applicationId: request.applicationId,
      billRefNumber,
      amountExpected: amount,
      ...payer,
      checkoutPayload,
    });

    const invoice = await requestPesaflowInvoice(checkoutUrl, checkoutPayload);

    await updatePaymentTransactionInvoice(transaction.id, {
      invoiceNumber: invoice.invoice_number,
      invoiceLink: invoice.invoice_link,
      checkoutPayload,
    });

    return {
      success: true,
      paymentId: transaction.id,
      billRefNumber,
      invoiceNumber: invoice.invoice_number,
      invoiceLink: invoice.invoice_link,
      checkoutUrl,
      checkoutPayload: checkoutPayload as unknown as Record<string, string>,
    };
  } catch (error) {
    console.error('[Pesaflow] initiate repayment failed:', error);
    return {
      success: false,
      configured: true,
      error: error instanceof Error ? error.message : 'Failed to initiate payment',
    };
  }
}

export async function getPaymentCheckoutSession(paymentId: string) {
  const user = await getCurrentUser();

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
    include: {
      application: { select: { userId: true } },
    },
  });

  if (!transaction || transaction.application.userId !== user.id) {
    return null;
  }

  const checkoutUrl = getPesaflowCheckoutUrl();
  if (!checkoutUrl) {
    return null;
  }

  const payload = transaction.checkoutPayload as Record<string, string>;
  const invoiceLink = extractStoredInvoiceLink(transaction.checkoutPayload);

  return {
    checkoutUrl,
    payload,
    invoiceLink,
    invoiceNumber: transaction.pesaflowInvoiceNumber,
    billRefNumber: transaction.billRefNumber,
    applicationId: transaction.applicationId,
    amountExpected: transaction.amountExpected,
    status: transaction.status,
  };
}
