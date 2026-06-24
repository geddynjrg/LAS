export const PENDING_PAYMENT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
export const PAYMENT_AMOUNT_TOLERANCE = 0.01;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isRepaymentEligibleStatus(status: string): boolean {
  return status === 'DISBURSED';
}

export function isPaymentAmountSufficient(
  amountPaid: number,
  amountExpected: number,
): boolean {
  return amountPaid + PAYMENT_AMOUNT_TOLERANCE >= amountExpected;
}

export function isPendingPaymentStale(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > PENDING_PAYMENT_MAX_AGE_MS;
}
