import { ApplicationStatus } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { formatKenyanPhoneForApi } from '@/lib/utils/string';

export type SoftDuplicateResult = {
  phoneDuplicate: boolean;
  nationalIdDuplicate: boolean;
  message: string;
};

/** In-progress statuses for soft cross-application duplicate checks. */
export const SOFT_DUPLICATE_IN_PROGRESS_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.DRAFT,
  ApplicationStatus.UNSUBMITTED,
  ApplicationStatus.GROUP_MEMBER_CONFIRMATION,
];

function normalizePhoneDigits(value: string): string {
  const formatted = formatKenyanPhoneForApi(value);
  return (formatted ?? value).replace(/\D+/g, '');
}

function normalizeId(value: string): string {
  return value.replace(/\D+/g, '');
}

/**
 * Soft check for phone / National ID on OTHER in-progress applications.
 * Returns flags + generic message only — never other applicants' PII.
 */
export async function checkSoftDuplicatesAcrossApplications(input: {
  phone?: string | null;
  nationalId?: string | null;
  /** Human-readable Application.applicationId to exclude. */
  excludeApplicationId?: string | null;
}): Promise<SoftDuplicateResult> {
  const phoneDigits = normalizePhoneDigits(input.phone ?? '');
  const nationalId = normalizeId(input.nationalId ?? '');

  let phoneDuplicate = false;
  let nationalIdDuplicate = false;

  if (phoneDigits.length < 9 && nationalId.length < 5) {
    return { phoneDuplicate: false, nationalIdDuplicate: false, message: '' };
  }

  const orClauses: Array<
    { phoneNumber: { contains: string } } | { nationalIdCode: string }
  > = [];
  if (phoneDigits.length >= 9) {
    orClauses.push({ phoneNumber: { contains: phoneDigits.slice(-9) } });
  }
  if (nationalId.length >= 5) {
    orClauses.push({ nationalIdCode: nationalId });
  }

  const members = await prisma.memberData.findMany({
    where: {
      AND: [
        {
          application: {
            status: { in: SOFT_DUPLICATE_IN_PROGRESS_STATUSES },
            ...(input.excludeApplicationId
              ? { applicationId: { not: input.excludeApplicationId } }
              : {}),
          },
        },
        { OR: orClauses },
      ],
    },
    select: {
      phoneNumber: true,
      nationalIdCode: true,
    },
    take: 50,
  });

  for (const member of members) {
    if (
      nationalId.length >= 5 &&
      normalizeId(member.nationalIdCode) === nationalId
    ) {
      nationalIdDuplicate = true;
    }
    if (
      phoneDigits.length >= 9 &&
      normalizePhoneDigits(member.phoneNumber).endsWith(phoneDigits.slice(-9))
    ) {
      phoneDuplicate = true;
    }
  }

  let message = '';
  if (phoneDuplicate && nationalIdDuplicate) {
    message =
      'This phone number and National ID appear on another in-progress application. You may continue if this is intentional — please confirm below.';
  } else if (phoneDuplicate) {
    message =
      'This phone number appears on another in-progress application. You may continue if this is intentional — please confirm below.';
  } else if (nationalIdDuplicate) {
    message =
      'This National ID appears on another in-progress application. You may continue if this is intentional — please confirm below.';
  }

  return { phoneDuplicate, nationalIdDuplicate, message };
}

/** Check a list of members; aggregate soft flags without exposing PII. */
export async function checkSoftDuplicatesForMembers(input: {
  applicationId: string;
  members: Array<{
    phoneNumber?: string | null;
    nationalIdCode?: string | null;
  }>;
}): Promise<SoftDuplicateResult> {
  let phoneDuplicate = false;
  let nationalIdDuplicate = false;

  for (const member of input.members) {
    const result = await checkSoftDuplicatesAcrossApplications({
      phone: member.phoneNumber,
      nationalId: member.nationalIdCode,
      excludeApplicationId: input.applicationId,
    });
    phoneDuplicate = phoneDuplicate || result.phoneDuplicate;
    nationalIdDuplicate = nationalIdDuplicate || result.nationalIdDuplicate;
  }

  let message = '';
  if (phoneDuplicate && nationalIdDuplicate) {
    message =
      'One or more phone numbers and National IDs appear on another in-progress application. You may continue if this is intentional — please confirm below.';
  } else if (phoneDuplicate) {
    message =
      'One or more phone numbers appear on another in-progress application. You may continue if this is intentional — please confirm below.';
  } else if (nationalIdDuplicate) {
    message =
      'One or more National IDs appear on another in-progress application. You may continue if this is intentional — please confirm below.';
  }

  return { phoneDuplicate, nationalIdDuplicate, message };
}
