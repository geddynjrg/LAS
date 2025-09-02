import { TaxonomyOption } from '@/lib/api/taxonomy.service';
import { Member } from '@/lib/types/application.types';

export interface MemberValidationError {
  type: 'duplicate_limited_role' | 'invalid_role' | 'missing_required_role';
  message: string;
  memberIndex?: number;
  roleValue?: string;
  conflictingMemberIndex?: number;
}

export interface MemberValidationResult {
  isValid: boolean;
  errors: MemberValidationError[];
}

/**
 * Comprehensive validation of all members against taxonomy constraints
 */
export function validateMembersAgainstTaxonomy(
  members: Partial<Member>[],
  memberTypeOptions: TaxonomyOption[]
): MemberValidationResult {
  const errors: MemberValidationError[] = [];

  if (!memberTypeOptions || memberTypeOptions.length === 0) {
    return { isValid: true, errors: [] }; // Cannot validate without taxonomy data
  }

  // Create maps for efficient lookups
  const validRoles = new Set(memberTypeOptions.map(option => option.value));
  const limitedRoles = new Map<string, TaxonomyOption>();

  memberTypeOptions.forEach(option => {
    if (option.limitedRole) {
      limitedRoles.set(option.value, option);
    }
  });

  // Track limited role assignments
  const limitedRoleAssignments = new Map<string, number>(); // role -> memberIndex

  // Validate each member
  members.forEach((member, index) => {
    if (!member.type) {
      return; // Skip members without roles (will be caught by individual field validation)
    }

    // Check if role is valid
    if (!validRoles.has(member.type)) {
      errors.push({
        type: 'invalid_role',
        message: `"${member.type}" is not a valid role. Please select from the available options.`,
        memberIndex: index,
        roleValue: member.type,
      });
      return;
    }

    // Check for duplicate limited roles
    if (limitedRoles.has(member.type)) {
      const existingMemberIndex = limitedRoleAssignments.get(member.type);
      if (existingMemberIndex !== undefined) {
        errors.push({
          type: 'duplicate_limited_role',
          message: `The ${limitedRoles.get(member.type)?.label} role can only be assigned to one member. Currently assigned to ${members[existingMemberIndex]?.fullname || `Member ${existingMemberIndex + 1}`} and ${member.fullname || `Member ${index + 1}`}.`,
          memberIndex: index,
          roleValue: member.type,
          conflictingMemberIndex: existingMemberIndex,
        });
      } else {
        limitedRoleAssignments.set(member.type, index);
      }
    }
  });

  // TODO: Add validation for required roles if needed
  // Example: Check if Chairman is required and present
  // const requiredRoles = memberTypeOptions.filter(option => option.required);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get user-friendly error messages for display
 */
export function getMemberValidationErrorMessages(
  validationResult: MemberValidationResult
): string[] {
  return validationResult.errors.map(error => error.message);
}

/**
 * Check if a specific role can be assigned to a member (excluding the member being edited)
 */
export function canAssignRole(
  roleValue: string,
  members: Partial<Member>[],
  memberTypeOptions: TaxonomyOption[],
  excludeMemberIndex?: number
): { canAssign: boolean; reason?: string } {
  // Check if role exists in taxonomy
  const roleOption = memberTypeOptions.find(option => option.value === roleValue);
  if (!roleOption) {
    return { canAssign: false, reason: 'Invalid role' };
  }

  // If not a limited role, it can always be assigned
  if (!roleOption.limitedRole) {
    return { canAssign: true };
  }

  // Check if limited role is already taken by another member
  const existingMemberIndex = members.findIndex((member, index) =>
    member.type === roleValue && index !== excludeMemberIndex
  );

  if (existingMemberIndex !== -1) {
    const existingMember = members[existingMemberIndex];
    return {
      canAssign: false,
      reason: `The ${roleOption.label} role is already assigned to ${existingMember?.fullname || `Member ${existingMemberIndex + 1}`}`
    };
  }

  return { canAssign: true };
}