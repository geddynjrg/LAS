'use server';

import { getCurrentUser } from '@/lib/data/application';
import { prisma } from '@/lib/db/prisma';
import { PaymentStatus } from '@/generated/prisma';
import { extractStoredInvoiceLink } from '@/lib/payments/pesaflow-invoice';
import { roundMoney } from '@/lib/payments/pesaflow-utils';

export interface RepaymentSummary {
  applicationId: string;
  loanAmount: number;
  totalPaid: number;
  outstandingBalance: number;
  hasPendingPayment: boolean;
  pendingPaymentId?: string;
  pendingBillRefNumber?: string;
  pendingInvoiceLink?: string;
}

export async function getRepaymentSummary(
  applicationId: string,
): Promise<RepaymentSummary | null> {
  const user = await getCurrentUser();

  const application = await prisma.application.findUnique({
    where: { applicationId },
    include: {
      loanConditions: true,
      paymentTransactions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!application || application.userId !== user.id) {
    return null;
  }

  const loanAmount = application.loanConditions?.loanAmount ?? 0;
  const totalPaid = roundMoney(
    application.paymentTransactions
      .filter((payment) => payment.status === PaymentStatus.COMPLETED)
      .reduce(
        (sum, payment) => sum + (payment.amountPaid ?? payment.amountExpected),
        0,
      ),
  );

  const outstandingBalance = roundMoney(Math.max(loanAmount - totalPaid, 0));
  const pending = application.paymentTransactions.find(
    (payment) => payment.status === PaymentStatus.PENDING,
  );

  return {
    applicationId,
    loanAmount,
    totalPaid,
    outstandingBalance,
    hasPendingPayment: Boolean(pending),
    pendingPaymentId: pending?.id,
    pendingBillRefNumber: pending?.billRefNumber,
    pendingInvoiceLink: pending
      ? extractStoredInvoiceLink(pending.checkoutPayload) ?? undefined
      : undefined,
  };
}
