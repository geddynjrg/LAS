"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import {
  groupDataSchema,
  type GroupData,
} from "@/app/apply/[id]/group-data/group-data-schema";
import { updateApplicationGroupData } from "@/lib/data/application";

export const groupDataAction: FormAction<GroupData> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, groupDataSchema);
  const redirectTo = formData.get("redirectTo")?.toString();
  const id = formData.get("id")?.toString();

  const { success, data, error } = groupDataSchema.safeParse(values);

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
  await updateApplicationGroupData(id, {
    basics: {
      groupName: data.groupName,
      groupRegistrationNumber: data.groupRegistrationNumber,
      dateFormed: data.dateFormed,
      groupRegistrationCertificate: data.groupRegistrationCertificate.name,
      listOfMembersOnCertificate: data.listOfMembersOnCertificate.name,
    },
    background: {
      purposeOfTheGroup: data.groupPurpose,
      keyActivitiesOfTheGroup: data.groupActivities,
      groupCreditHistory: data.groupCreditHistory.name,
      valueChain: data.valueChain,
      other: data.other,
      tableBanking: {
        tableBankingExperience: data.tableBankingExperience ?? undefined,
        tableBankingShareContribution:
          data.tableBankingShareContribution ?? undefined,
        tableBankingTotalLoanedOut:
          data.tableBankingTotalLoanedOut ?? undefined,
        tableBankingTotalRevolvingFund:
          data.tableBankingTotalRevolvingFund ?? undefined,
      },
    },
    location: {
      countyOfOperation: data.countyOfOperation,
      constituency: data.constituency,
      ward: data.ward,
      meetingPoint: data.meetingPoint,
      nearestLandmark: data.nearestLandmark,
    },
  });

  redirect(redirectTo);
};
