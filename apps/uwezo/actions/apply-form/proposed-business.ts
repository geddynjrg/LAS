"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import {
  updateApplicationLoanConditionsData,
  updateApplicationProposedBusinessData,
} from "@/actions/application";
import {
  loanConditionsDataSchema,
  type LoanConditionsData,
} from "@/actions/apply-form/loan-conditions-schema";
import {
  proposedBusinessDataSchema,
  type ProposedBusinessData,
} from "@/actions/apply-form/proposed-business-data-schema";

export const proposedBusiness: FormAction<ProposedBusinessData> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, proposedBusinessDataSchema);
  const redirectTo = formData.get("redirectTo")?.toString();
  const id = formData.get("id")?.toString();

  const { success, data, error } = proposedBusinessDataSchema.safeParse(values);

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
  await updateApplicationProposedBusinessData(id, {
    averageIncome: data.averageIncome,
    businessType: data.businessType,
    costOfGoods: data.costOfGoods,
    natureOfBusiness: data.natureOfBusiness,
    rentForBusiness: data.rentForBusiness,
    salaries: data.salaries,
    transportForBusinessStock: data.transportForBusinessStock,
    yearsInBusiness: data.yearsInBusiness,
  });

  redirect(redirectTo);
};
