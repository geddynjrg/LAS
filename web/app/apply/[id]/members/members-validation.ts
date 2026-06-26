import { TaxonomyOption } from '@/lib/api/taxonomy.service';
import { Member } from '@/lib/types/application.types';
import { formatKenyanPhoneForApi, phonesEqual } from '@/lib/utils/string';

/** Leadership roles that may only be assigned to one member per application. */
export const LIMITED_MEMBER_POSITIONS = [
  'Chairperson',
  'Chairman',
  'Treasurer',
  'Secretary',
] as const;

export function isLimitedMemberPosition(roleValue: string): boolean {
  const normalized = roleValue.trim().toLowerCase();
  return LIMITED_MEMBER_POSITIONS.some(
    (role) => role.toLowerCase() === normalized,
  );
}

export function limitedMemberPositionLabel(roleValue: string): string {
  return (
    LIMITED_MEMBER_POSITIONS.find(
      (role) => role.toLowerCase() === roleValue.trim().toLowerCase(),
    ) ?? roleValue
  );
}

export interface MemberValidationError {
  type:
    | 'duplicate_limited_role'
    | 'invalid_role'
    | 'missing_required_role'
    | 'duplicate_phone_number'
    | 'duplicate_national_id';
  message: string;
  memberIndex?: number;
  roleValue?: string;
  conflictingMemberIndex?: number;
  phoneNumber: string;
  nationalIdCode?: string;
}

export interface MemberValidationResult {
  isValid: boolean;
  errors: MemberValidationError[];
}

// /**
//  * Comprehensive validation of all members against taxonomy constraints
//  */
// export function validateMembersAgainstTaxonomy(
//   members: Partial<Member>[],
//   memberTypeOptions: TaxonomyOption[]
// ): MemberValidationResult {
//   const errors: MemberValidationError[] = [];

//   if (!memberTypeOptions || memberTypeOptions.length === 0) {
//     return { isValid: true, errors: [] }; // Cannot validate without taxonomy data
//   }

//   // Create maps for efficient lookups
//   const validRoles = new Set(memberTypeOptions.map(option => option.value));
//   const limitedRoles = new Map<string, TaxonomyOption>();

//   memberTypeOptions.forEach(option => {
//     if (option.limitedRole) {
//       limitedRoles.set(option.value, option);
//     }
//   });

//   // Track limited role assignments
//   const limitedRoleAssignments = new Map<string, number>(); // role -> memberIndex
//   const phoneNumberAssignments = new Map<string, number>(); // phoneNumber -> memberIndex
//   const nationalIdAssignments = new Map<string, number>(); // nationalIdCode -> memberIndex

//   // Validate each member
//   members.forEach((member, index) => {
//     if (!member.type) {
//       return; // Skip members without roles (will be caught by individual field validation)
//     }

//     // Check if role is valid
//     if (!validRoles.has(member.type)) {
//       errors.push({
//         type: 'invalid_role',
//         message: `"${member.type}" is not a valid role. Please select from the available options.`,
//         memberIndex: index,
//         roleValue: member.type,
//         phoneNumber: ''
//       });
//       return;
//     }

//     // Check for duplicate limited roles
//     if (limitedRoles.has(member.type)) {
//       const existingMemberIndex = limitedRoleAssignments.get(member.type);
//       if (existingMemberIndex !== undefined) {
//         errors.push({
//           type: 'duplicate_limited_role',
//           message: `The ${limitedRoles.get(member.type)?.label} role can only be assigned to one member. Currently assigned to ${members[existingMemberIndex]?.fullname || `Member ${existingMemberIndex + 1}`} and ${member.fullname || `Member ${index + 1}`}.`,
//           memberIndex: index,
//           roleValue: member.type,
//           conflictingMemberIndex: existingMemberIndex,
//           phoneNumber: ''
//         });
//       } else {
//         limitedRoleAssignments.set(member.type, index);
//       }
//     }

//     // Check for duplicate phone numbers
//     if (member.phoneNumber) {
//       const existingMemberIndex = phoneNumberAssignments.get(member.phoneNumber);
//       if (existingMemberIndex !== undefined) {
//         errors.push({
//           type: 'duplicate_phone_number',
//           message: `Phone number ${member.phoneNumber} is already used by ${members[existingMemberIndex]?.fullname || `Member ${existingMemberIndex + 1}`}. Each member must have a unique phone number.`,
//           memberIndex: index,
//           phoneNumber: member.phoneNumber,
//           conflictingMemberIndex: existingMemberIndex,
//         });
//       } else {
//         phoneNumberAssignments.set(member.phoneNumber, index);
//       }
//     }

//     // Check for duplicate national ID codes
//     if (member.nationalIdCode) {
//       const existingMemberIndex = nationalIdAssignments.get(member.nationalIdCode);
//       if (existingMemberIndex !== undefined) {
//         errors.push({
//           type: 'duplicate_national_id',
//           message: `National ID ${member.nationalIdCode} is already used by ${members[existingMemberIndex]?.fullname || `Member ${existingMemberIndex + 1}`}. Each member must have a unique national ID.`,
//           memberIndex: index,
//           nationalIdCode: member.nationalIdCode,
//           conflictingMemberIndex: existingMemberIndex,
//           phoneNumber: ''
//         });
//       } else {
//         nationalIdAssignments.set(member.nationalIdCode, index);
//       }
//     }
//   });

//   // TODO: Add validation for required roles if needed
//   // Example: Check if Chairman is required and present
//   // const requiredRoles = memberTypeOptions.filter(option => option.required);

//   return {
//     isValid: errors.length === 0,
//     errors,
//   };
// }

/**
 * Enhanced validation that considers member IDs for updates
 */
export function validateMembersAgainstTaxonomy(
  members: (Partial<Member> & { id?: string })[],
  memberTypeOptions: TaxonomyOption[],
  existingMembers: {
    id: string;
    phoneNumber: string;
    nationalIdCode: string;
  }[] = [],
): MemberValidationResult {
  const errors: MemberValidationError[] = [];

  if (!memberTypeOptions || memberTypeOptions.length === 0) {
    return { isValid: true, errors: [] };
  }

  // Create maps for efficient lookups
  const validRoles = new Set(memberTypeOptions.map((option) => option.value));
  const limitedRoles = new Map<string, TaxonomyOption>();

  memberTypeOptions.forEach((option) => {
    if (option.limitedRole || isLimitedMemberPosition(option.value)) {
      limitedRoles.set(option.value, {
        ...option,
        limitedRole: true,
      });
    }
  });

  // Ensure leadership roles are limited even if taxonomy metadata is missing.
  LIMITED_MEMBER_POSITIONS.forEach((position) => {
    if (!limitedRoles.has(position)) {
      limitedRoles.set(position, {
        label: position,
        value: position,
        limitedRole: true,
      });
    }
  });

  // Track limited role assignments, phone numbers, and national IDs
  const limitedRoleAssignments = new Map<string, number>();
  const phoneNumberAssignments = new Map<
    string,
    { memberIndex: number; memberId?: string; nationalIdCode?: string }
  >();
  const nationalIdAssignments = new Map<
    string,
    { memberIndex: number; memberId?: string }
  >();

  const isSameMemberRecord = (
    candidate: { memberId?: string; nationalIdCode?: string },
    member: Partial<Member> & { id?: string },
  ) =>
    (candidate.memberId && member.id && candidate.memberId === member.id) ||
    (candidate.nationalIdCode &&
      member.nationalIdCode &&
      candidate.nationalIdCode === member.nationalIdCode);

  // First, add existing members to tracking (for validation against new/updated members)
  existingMembers.forEach((existingMember) => {
    const normalizedPhone = formatKenyanPhoneForApi(existingMember.phoneNumber);
    if (normalizedPhone) {
      phoneNumberAssignments.set(normalizedPhone, {
        memberIndex: -1,
        memberId: existingMember.id,
        nationalIdCode: existingMember.nationalIdCode,
      });
    }
    if (existingMember.nationalIdCode) {
      nationalIdAssignments.set(existingMember.nationalIdCode, {
        memberIndex: -1,
        memberId: existingMember.id,
      });
    }
  });

  // Validate each member
  members.forEach((member, index) => {
    if (!member.type) {
      return;
    }

    // Check if role is valid
    if (!validRoles.has(member.type)) {
      errors.push({
        type: 'invalid_role',
        message: `"${member.type}" is not a valid role. Please select from the available options.`,
        memberIndex: index,
        roleValue: member.type,
        phoneNumber: '',
      });
      return;
    }

    // Check for duplicate limited roles (case-insensitive for leadership titles)
    const limitedRoleKey = member.type.trim().toLowerCase();
    const isLimited =
      limitedRoles.has(member.type) || isLimitedMemberPosition(member.type);

    if (isLimited) {
      const existingMemberIndex = limitedRoleAssignments.get(limitedRoleKey);
      if (existingMemberIndex !== undefined) {
        errors.push({
          type: 'duplicate_limited_role',
          message: `The ${limitedMemberPositionLabel(member.type)} role can only be assigned to one member. Currently assigned to ${members[existingMemberIndex]?.fullname || `Member ${existingMemberIndex + 1}`} and ${member.fullname || `Member ${index + 1}`}.`,
          memberIndex: index,
          roleValue: member.type,
          conflictingMemberIndex: existingMemberIndex,
          phoneNumber: '',
        });
      } else {
        limitedRoleAssignments.set(limitedRoleKey, index);
      }
    }

    // Check for duplicate phone numbers
    if (member.phoneNumber) {
      const normalizedPhone = formatKenyanPhoneForApi(member.phoneNumber);
      if (!normalizedPhone) {
        return;
      }

      const existingAssignment = phoneNumberAssignments.get(normalizedPhone);

      if (existingAssignment) {
        if (!isSameMemberRecord(existingAssignment, member)) {
          const conflictingMember =
            existingAssignment.memberIndex >= 0
              ? members[existingAssignment.memberIndex]
              : existingMembers.find((existing) =>
                  phonesEqual(existing.phoneNumber, normalizedPhone),
                );

          const conflictingName =
            conflictingMember && 'fullname' in conflictingMember
              ? conflictingMember.fullname
              : undefined;

          errors.push({
            type: 'duplicate_phone_number',
            message: conflictingName
              ? `Phone number ${normalizedPhone} is already used by ${conflictingName}. Each member must have a unique phone number.`
              : `Phone number ${normalizedPhone} is already used by another member in this group. Each member must have a unique phone number.`,
            memberIndex: index,
            phoneNumber: normalizedPhone,
            conflictingMemberIndex:
              existingAssignment.memberIndex >= 0
                ? existingAssignment.memberIndex
                : undefined,
          });
        }
      } else {
        phoneNumberAssignments.set(normalizedPhone, {
          memberIndex: index,
          memberId: member.id,
          nationalIdCode: member.nationalIdCode,
        });
      }
    }

    // Check for duplicate national ID codes
    if (member.nationalIdCode) {
      const existingAssignment = nationalIdAssignments.get(
        member.nationalIdCode,
      );

      if (existingAssignment) {
        // Allow the same member to keep their national ID when editing
        const isSameMember = existingAssignment.memberId === member.id;

        if (!isSameMember) {
          errors.push({
            type: 'duplicate_national_id',
            message: `National ID ${member.nationalIdCode} is already used by another member in this group. Each member must have a unique national ID.`,
            memberIndex: index,
            nationalIdCode: member.nationalIdCode,
            conflictingMemberIndex:
              existingAssignment.memberIndex >= 0
                ? existingAssignment.memberIndex
                : undefined,
            phoneNumber: '',
          });
        }
      } else {
        // Track this national ID assignment
        nationalIdAssignments.set(member.nationalIdCode, {
          memberIndex: index,
          memberId: member.id,
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a specific national ID can be assigned to a member
 */
export function canAssignNationalId(
  nationalIdCode: string,
  members: (Partial<Member> & { id?: string })[],
  existingMembers: {
    id: string;
    phoneNumber: string;
    nationalIdCode: string;
  }[] = [],
  excludeMemberId?: string,
): { canAssign: boolean; reason?: string } {
  if (!nationalIdCode) {
    return { canAssign: true };
  }

  // Check against existing members in the form
  const existingFormMemberIndex = members.findIndex(
    (member, index) =>
      member.nationalIdCode === nationalIdCode && member.id !== excludeMemberId,
  );

  if (existingFormMemberIndex !== -1) {
    const existingMember = members[existingFormMemberIndex];
    return {
      canAssign: false,
      reason: `This National ID is already used by ${existingMember?.fullname || `Member ${existingFormMemberIndex + 1}`}. Each member must have a unique National ID.`,
    };
  }

  // Check against existing members in database (excluding the current member being edited)
  const existingDbMember = existingMembers.find(
    (member) =>
      member.nationalIdCode === nationalIdCode && member.id !== excludeMemberId,
  );

  if (existingDbMember) {
    return {
      canAssign: false,
      reason: `This National ID is already used by another member in this group. Each member must have a unique National ID.`,
    };
  }

  return { canAssign: true };
}

/**
 * Check if a specific phone number can be assigned to a member
 */
export function canAssignPhoneNumber(
  phoneNumber: string,
  members: (Partial<Member> & { id?: string })[],
  existingMembers: {
    id: string;
    phoneNumber: string;
    nationalIdCode: string;
  }[] = [],
  excludeMemberId?: string,
  excludeNationalIdCode?: string,
): { canAssign: boolean; reason?: string } {
  const normalizedPhone = formatKenyanPhoneForApi(phoneNumber);
  if (!normalizedPhone) {
    return { canAssign: true };
  }

  const isExcludedMember = (member: { id?: string; nationalIdCode?: string }) =>
    (excludeMemberId && member.id === excludeMemberId) ||
    (excludeNationalIdCode && member.nationalIdCode === excludeNationalIdCode);

  const existingFormMember = members.find(
    (member) =>
      member.phoneNumber &&
      phonesEqual(member.phoneNumber, normalizedPhone) &&
      !isExcludedMember(member),
  );

  if (existingFormMember) {
    return {
      canAssign: false,
      reason: `This phone number is already used by ${existingFormMember.fullname || 'another member'}. Each member must have a unique phone number.`,
    };
  }

  const existingDbMember = existingMembers.find(
    (member) =>
      phonesEqual(member.phoneNumber, normalizedPhone) &&
      !isExcludedMember(member),
  );

  if (existingDbMember) {
    return {
      canAssign: false,
      reason:
        'This phone number is already used by another member in this group. Each member must have a unique phone number.',
    };
  }

  return { canAssign: true };
}

/**
 * Get user-friendly error messages for display
 */
export function getMemberValidationErrorMessages(
  validationResult: MemberValidationResult,
): string[] {
  return validationResult.errors.map((error) => error.message);
}

/**
 * Check if a specific role can be assigned to a member (excluding the member being edited)
 */
export function canAssignRole(
  roleValue: string,
  members: Partial<Member>[],
  memberTypeOptions: TaxonomyOption[],
  excludeMemberIndex?: number,
): { canAssign: boolean; reason?: string } {
  // Check if role exists in taxonomy
  const roleOption = memberTypeOptions.find(
    (option) => option.value === roleValue,
  );
  if (!roleOption) {
    return { canAssign: false, reason: 'Invalid role' };
  }

  // If not a limited role, it can always be assigned
  if (!roleOption.limitedRole && !isLimitedMemberPosition(roleValue)) {
    return { canAssign: true };
  }

  // Check if limited role is already taken by another member
  const roleKey = roleValue.trim().toLowerCase();
  const existingMemberIndex = members.findIndex(
    (member, index) =>
      member.type?.trim().toLowerCase() === roleKey &&
      index !== excludeMemberIndex,
  );

  if (existingMemberIndex !== -1) {
    const existingMember = members[existingMemberIndex];
    return {
      canAssign: false,
      reason: `The ${roleOption.label} role is already assigned to ${existingMember?.fullname || `Member ${existingMemberIndex + 1}`}`,
    };
  }

  return { canAssign: true };
}
