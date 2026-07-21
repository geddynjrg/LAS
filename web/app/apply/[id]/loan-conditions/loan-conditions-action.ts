'use server';

import {
  type LoanConditionsData,
  loanConditionsDataSchema,
} from '@/app/apply/[id]/loan-conditions/loan-conditions-schema';
import {
  getApplicationById,
  updateApplicationLoanConditionsData,
} from '@/lib/data/application';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormZodDataValues } from '@workspace/ui/lib/utils';
import { redirect } from 'next/navigation';

export const loanConditionsAction: FormAction<LoanConditionsData> = async (
  _prev,
  formData,
) => {
  const values = getFormZodDataValues(formData, loanConditionsDataSchema);
  const redirectTo = formData.get('redirectTo')?.toString();
  const id = formData.get('id')?.toString();

  const { success, data, error } = loanConditionsDataSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  if (!redirectTo) {
    throw new Error('No redirect URL provided');
  }

  if (!id) {
    throw new Error('No application ID provided');
  }

  await getApplicationById(id);

  await updateApplicationLoanConditionsData(id, {
    loanType: data.loanType,
    loanAmount: data.loanAmount,
    repaymentPeriod: data.repaymentPeriod,
    accountNumber: data.accountNumber,
    bankBranch: data.bankBranch,
    bankName: data.bankName,
    institutionType: data.institutionType,
  });

  redirect(redirectTo);
};
