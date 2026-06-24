'use server';

import {
  type LoanConditionsData,
  loanConditionsDataSchema,
} from '@/app/apply/[id]/loan-conditions/loan-conditions-schema';
import { checkGroupLoanHistory } from '@/lib/api/lms-loan-history.service';
import { loanTypeValues } from '@/lib/constants';
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

  const application = await getApplicationById(id);
  const registrationNumber =
    application?.groupData?.basics?.groupRegistrationNumber?.trim() ?? '';

  if (registrationNumber) {
    const eligibility = await checkGroupLoanHistory(registrationNumber);
    const fieldErrors: Record<string, string[]> = {};

    if (!eligibility.can_proceed) {
      fieldErrors.loanType = [
        'Your group has an outstanding loan balance. Please repay before continuing.',
      ];
    } else if (data.loanType === loanTypeValues.Endeleza.title) {
      if (!eligibility.eligible_for_endeleza) {
        fieldErrors.loanType = [
          'Endeleza is only available to groups that have fully cleared a previous Uwezo Fund loan.',
        ];
      }

      const endelezaMin =
        eligibility.endeleza_min_amount ??
        loanTypeValues.Endeleza.minLoanAmount;
      const endelezaMax =
        eligibility.endeleza_max_amount ??
        loanTypeValues.Endeleza.maxLoanAmount;

      if (data.loanAmount < endelezaMin) {
        fieldErrors.loanAmount = [
          `Minimum Endeleza loan amount is KES ${endelezaMin.toLocaleString()}.`,
        ];
      }

      if (data.loanAmount > endelezaMax) {
        fieldErrors.loanAmount = [
          `Maximum Endeleza loan amount is KES ${endelezaMax.toLocaleString()}.`,
        ];
      }
    } else if (data.loanType === loanTypeValues.Wezesha.title) {
      if (eligibility.eligible_for_endeleza) {
        fieldErrors.loanType = [
          'Your group has cleared a previous loan. Please select Endeleza.',
        ];
      } else if (eligibility.eligible_for_wezesha === false) {
        fieldErrors.loanType = [
          'Wezesha is not available for this group based on loan history.',
        ];
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        errors: fieldErrors,
        values,
      };
    }
  }

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
