"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import {
  loanConditionsDataSchema,
  type LoanConditionsData,
} from "@/app/apply/[id]/loan-conditions/loan-conditions-schema";
import { updateApplicationLoanConditionsData } from "@/lib/data/application";

export const loanConditionsAction: FormAction<LoanConditionsData> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, loanConditionsDataSchema);
  const redirectTo = formData.get("redirectTo")?.toString();
  const id = formData.get("id")?.toString();

  const { success, data, error } = loanConditionsDataSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  if (!redirectTo) {
    throw new Error("No redirect URL provided");
  }

  if (!id) {
    throw new Error("No application ID provided");
  }

  /* Submit data to dummy data list */
  await updateApplicationLoanConditionsData(id, {
    purposeOfLoan: data.purposeOfLoan,
    loanType: data.loanType,
    loanAmount: data.loanAmount,
    repaymentPeriod: data.repaymentPeriod,
    accountNumber: data.accountNumber,
    bankBranch: data.bankBranch,
    bankName: data.bankName,
  });

  redirect(redirectTo);
};
