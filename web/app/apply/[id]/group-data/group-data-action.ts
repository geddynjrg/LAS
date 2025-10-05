'use server';

import {
  type GroupData,
  groupDataSchema,
} from '@/app/apply/[id]/group-data/group-data-schema';
import { ApplicationStatus } from '@/generated/prisma';
import {
  getConstituenciesForCountyName,
  getConstituencyOptions,
  getCountyOptions,
} from '@/lib/api/counties.service';
import type { TaxonomyOption } from '@/lib/api/taxonomy.service';
import {
  updateApplicationGroupData,
  updateApplicationStatus,
} from '@/lib/data/application';
import { capitalizeWords } from '@/lib/utils/string';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormZodDataValues } from '@workspace/ui/lib/utils';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const groupDataAction: FormAction<GroupData> = async (
  _prev,
  formData,
) => {
  try {
    const values = getFormZodDataValues(formData, groupDataSchema);
    const redirectTo = formData.get('redirectTo')?.toString();
    const id = formData.get('id')?.toString();

    const { success, data, error } = groupDataSchema.safeParse(values);

    if (error) {
      console.log(
        'groupDataAction: Validation errors',
        error.flatten().fieldErrors,
      );
      return {
        success,
        errors: error.flatten().fieldErrors,
        values,
      };
    }

    // Validate county and constituency against available options
    const [countyOptions, constituencyOptions] = await Promise.all([
      getCountyOptions(),
      getConstituencyOptions(),
    ]);

    const validationErrors: Record<string, string[]> = {};

    // Check if county exists in available options
    const isValidCounty = countyOptions.some(
      (c) =>
        c.value === data.countyOfOperation ||
        c.label === data.countyOfOperation,
    );

    if (!isValidCounty) {
      validationErrors.countyOfOperation = [
        'Please select a valid county from the list',
      ];
    }

    // Check if constituency exists in available options
    const isValidConstituency = constituencyOptions.some(
      (c) => c.value === data.constituency || c.label === data.constituency,
    );

    if (!isValidConstituency) {
      validationErrors.constituency = [
        'Please select a valid constituency from the list',
      ];
    }

    // Check if constituency belongs to the selected county
    if (isValidCounty && isValidConstituency) {
      const constituenciesForCounty = constituencyOptions.filter(
        (c) => c.countyName === data.countyOfOperation,
      );

      const constituencyBelongsToCounty = constituenciesForCounty.some(
        (c) => c.value === data.constituency || c.label === data.constituency,
      );

      if (!constituencyBelongsToCounty) {
        validationErrors.constituency = [
          'The selected constituency does not belong to the selected county',
        ];
      }
    }

    // If there are validation errors, return them
    if (Object.keys(validationErrors).length > 0) {
      return {
        success: false,
        errors: validationErrors,
        values,
      };
    }

    if (!redirectTo) {
      throw new Error('No redirect URL provided');
    }

    if (!id) {
      throw new Error('No application ID provided');
    }

    // Files are already uploaded via API, just use the metadata
    const groupRegistrationCertificate = data.groupRegistrationCertificate || {
      fid: 0,
      filename: '',
      url: '',
    };
    const listOfMembersOnCertificate = data.listOfMembersOnCertificate || {
      fid: 0,
      filename: '',
      url: '',
    };
    const groupCreditHistory = data.groupCreditHistory || [
      { fid: 0, filename: '', url: '' },
    ];

    /* Submit data to database */
    await updateApplicationGroupData(id, {
      basics: {
        groupName: capitalizeWords(data.groupName),
        groupRegistrationNumber: data.groupRegistrationNumber,
        dateFormed: data.dateFormed,
        groupRegistrationCertificate,
        listOfMembersOnCertificate,
      },
      background: {
        purposeOfTheGroup: data.groupPurpose,
        keyActivitiesOfTheGroup: data.groupActivities,
        groupCreditHistory,
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

    await updateApplicationStatus(id, ApplicationStatus.DRAFT);

    // Revalidate the application pages to show updated file data
    revalidatePath(`/apply/${id}`);
    revalidatePath(`/apply/${id}/group-data`);

    redirect(redirectTo);
  } catch (error) {
    console.error('groupDataAction: Error occurred', error);
    throw error;
  }
};

export async function getConstituenciesForCountyAction(
  countyName: string,
): Promise<TaxonomyOption[]> {
  try {
    return await getConstituenciesForCountyName(countyName);
  } catch (error) {
    console.error('Error fetching constituencies for county:', error);
    return [];
  }
}
