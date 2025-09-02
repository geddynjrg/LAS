'use server';

import {
  type MembersData,
  membersDataSchema,
} from '@/app/apply/[id]/members/members-data-schema';
import {
  validateMembersAgainstTaxonomy,
  getMemberValidationErrorMessages,
} from '@/app/apply/[id]/members/members-validation';
import { updateApplicationMembersData } from '@/lib/data/application';
import { getFormFieldOptions } from '@/lib/api/taxonomy.service';
import { capitalizeWords } from '@/lib/utils/string';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { redirect } from 'next/navigation';

export const membersDataAction: FormAction<MembersData> = async (
  _prev,
  formData,
) => {
  const redirectTo = formData.get('redirectTo')?.toString();
  const id = formData.get('id')?.toString();

  // Prepare data for validation including members
  const formValues = {
    natureOfGroup: formData.get('natureOfGroup')?.toString() || '',
    members: formData.get('members')?.toString() || '[]', // This will be preprocessed by the schema
  };

  const { success, data, error } = membersDataSchema.safeParse(formValues);

  if (!success) {
    // For error response, we need to parse members for proper typing
    let parsedMembers;
    try {
      parsedMembers = JSON.parse(formValues.members);
    } catch {
      parsedMembers = [];
    }

    return {
      success,
      errors: error.flatten().fieldErrors,
      values: {
        natureOfGroup: formValues.natureOfGroup,
        members: parsedMembers,
      },
    };
  }

  if (!redirectTo) {
    throw new Error('No redirect URL provided');
  }

  if (!id) {
    throw new Error('No application ID provided');
  }

  /* Additional validation against taxonomy constraints */
  try {
    const memberTypeOptions = await getFormFieldOptions('memberType');

    if (!memberTypeOptions || memberTypeOptions.length === 0) {
      return {
        success: false,
        errors: {
          members: ['Member position types are currently unavailable. Please try again later.'],
        },
        values: {
          natureOfGroup: data.natureOfGroup,
          members: data.members,
        },
      };
    }

    const membersValidation = validateMembersAgainstTaxonomy(data.members, memberTypeOptions);

    if (!membersValidation.isValid) {
      return {
        success: false,
        errors: {
          members: getMemberValidationErrorMessages(membersValidation),
        },
        values: {
          natureOfGroup: data.natureOfGroup,
          members: data.members,
        },
      };
    }
  } catch (taxonomyError) {
    console.error('Failed to validate members against taxonomy:', taxonomyError);
    return {
      success: false,
      errors: {
        members: ['Unable to validate member positions. Please try again later.'],
      },
      values: {
        natureOfGroup: data.natureOfGroup,
        members: data.members,
      },
    };
  }

  /* Submit validated data */
  const capitalizedMembers = data.members.map(member => ({
    ...member,
    fullname: member.fullname ? capitalizeWords(member.fullname) : member.fullname,
  }));

  await updateApplicationMembersData(id, {
    natureOfTheGroup: data.natureOfGroup,
    members: capitalizedMembers,
  });

  redirect(redirectTo);
};
