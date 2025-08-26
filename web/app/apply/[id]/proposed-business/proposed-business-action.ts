'use server';

import {
  type CustomExpense,
  type ProposedBusinessData,
  proposedBusinessDataSchema,
  proposedBusinessFormSchema,
} from '@/app/apply/[id]/proposed-business/proposed-business-data-schema';
import { updateApplicationProposedBusinessData } from '@/lib/data/application-db';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormZodDataValues } from '@workspace/ui/lib/utils';
import { redirect } from 'next/navigation';

export const proposedBusinessAction: FormAction<ProposedBusinessData> = async (
  _prev,
  formData,
) => {
  const values = getFormZodDataValues(formData, proposedBusinessFormSchema);
  const redirectTo = formData.get('redirectTo')?.toString();
  const id = formData.get('id')?.toString();

  let customExpenses: CustomExpense[] = [];
  try {
    const customExpensesData = formData.get('customExpenses')?.toString();
    if (customExpensesData) {
      customExpenses = JSON.parse(customExpensesData);
    }
  } catch (error) {
    console.error('Error parsing custom expenses data', error);
    customExpenses = [];
  }

  const { success, data, error } = proposedBusinessDataSchema.safeParse({
    ...values,
    customExpenses,
  });

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

  /* Submit data to dummy data list */
  await updateApplicationProposedBusinessData(id, {
    averageIncome: data.averageIncome,
    businessType: data.businessType,
    costOfGoods: data.costOfGoods,
    natureOfBusiness: data.natureOfBusiness,
    rentForBusiness: data.rentForBusiness,
    salaries: data.salaries,
    transportForBusinessStock: data.transportForBusinessStock,
    yearsInBusiness: data.yearsInBusiness,
    customExpenses: data.customExpenses,
  });

  redirect(redirectTo);
};
