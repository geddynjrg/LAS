'use server';

import {
  ApplicationStatus,
  MemberStatus,
  QueueStatus,
  SyncAction,
  SyncStatus,
} from '@/generated/prisma';
import { getProfile } from '@/lib/api/profile';
import { addToSyncQueue } from '@/lib/api/sync.service';
import { handlePrismaError, prisma } from '@/lib/db/prisma';
import {
  AuthenticationError,
  isAuthenticationError,
} from '@/lib/errors/auth-error';
import { decodeJwtPayload } from '@/lib/jwt-utils';
import { getSession } from '@/lib/session';
import type {
  ApplicationData,
  DeclarationsData,
  GeneralDetails,
  GroupData,
  LoanConditionsData,
  MembersData,
  ProposedBusinessData,
} from '@/lib/types/application.types';
import { createApplicationId } from '@/lib/util';
import { formatKenyanPhoneForApi } from '@/lib/utils/string';
import { isFileUpload } from '@workspace/ui/lib/utils';

// Helper function to safely store JSON data - prevents double encoding
function safeParseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function serializeDateField(value: unknown): number | null | undefined {
  if (value == null) {
    return value as null | undefined;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function safeJsonStringify(data: any): string {
  // If it's already a string, check if it's valid JSON
  if (typeof data === 'string') {
    try {
      JSON.parse(data); // Test if it's valid JSON
      return data; // Return as-is if it's already a valid JSON string
    } catch {
      // If it's not valid JSON, stringify it
      return JSON.stringify(data);
    }
  }
  // If it's not a string, stringify it
  return JSON.stringify(data);
}

// Helper function to normalize phone numbers for consistent storage
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return formatKenyanPhoneForApi(phone) ?? phone.replace(/\s+/g, '');
}

function resolveDrupalUserIdFromSession(session: string): string {
  if (session.startsWith('ecitizen|')) {
    const uidStr = session.split('|')[1];
    if (!uidStr || isNaN(Number(uidStr)) || Number(uidStr) <= 0) {
      throw new AuthenticationError('Invalid eCitizen session token');
    }
    return uidStr;
  }

  const tokenPayload = decodeJwtPayload(session);
  const uid = tokenPayload?.uid;

  if (uid === undefined || uid === null || uid === '') {
    throw new AuthenticationError('No valid Drupal user ID found in JWT token');
  }

  const numericUid = typeof uid === 'number' ? uid : Number(uid);
  if (!Number.isFinite(numericUid) || numericUid <= 0) {
    throw new AuthenticationError('No valid Drupal user ID found in JWT token');
  }

  return String(numericUid);
}

// Helper function to get the current authenticated user
export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session) {
      throw new AuthenticationError('Unauthorized');
    }

    const drupalUserId = resolveDrupalUserIdFromSession(session);

    let profileData:
      | {
          email?: string;
          phoneNumber?: string;
          name?: string;
        }
      | undefined;

    try {
      const profile = await getProfile();
      profileData = profile.data;
    } catch (error) {
      console.warn(
        '[getCurrentUser] Profile fetch failed, using local user record:',
        error,
      );
    }

    let identifierType: 'EMAIL' | 'PHONE' | 'NAME' = 'NAME';
    if (profileData?.email) {
      identifierType = 'EMAIL';
    } else if (profileData?.phoneNumber) {
      identifierType = 'PHONE';
    } else if (profileData?.name) {
      identifierType = 'NAME';
    }

    const normalizedPhone = normalizePhone(profileData?.phoneNumber);
    const normalizedEmail = profileData?.email?.trim() || null;
    const displayName =
      profileData?.name ||
      profileData?.email ||
      profileData?.phoneNumber ||
      `user_${drupalUserId}`;

    let user = await prisma.user.findUnique({
      where: { drupalUserId },
    });

    if (!user && normalizedPhone) {
      user = await prisma.user.findUnique({
        where: { phoneNumber: normalizedPhone },
      });
    }

    if (!user && normalizedEmail) {
      user = await prisma.user.findFirst({
        where: { email: normalizedEmail },
      });
    }

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            drupalUserId,
            email: normalizedEmail,
            phoneNumber: normalizedPhone,
            name: displayName,
            identifierType,
          },
        });
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002' &&
          normalizedPhone
        ) {
          user = await prisma.user.findUnique({
            where: { phoneNumber: normalizedPhone },
          });
        }
        if (!user) {
          throw error;
        }
      }
    }

    if (user) {
      if (user.drupalUserId && user.drupalUserId !== drupalUserId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { drupalUserId },
        });
      }

      const updateData: Partial<{
        drupalUserId: string;
        email: string | null;
        phoneNumber: string | null;
        name: string;
        identifierType: 'EMAIL' | 'PHONE' | 'NAME';
      }> = {};

      if (!user.drupalUserId) {
        updateData.drupalUserId = drupalUserId;
      }
      if (normalizedEmail && user.email !== normalizedEmail) {
        updateData.email = normalizedEmail;
      }
      if (
        normalizedPhone &&
        normalizePhone(user.phoneNumber) !== normalizedPhone
      ) {
        const phoneOwner = await prisma.user.findUnique({
          where: { phoneNumber: normalizedPhone },
          select: { id: true, drupalUserId: true },
        });

        if (!phoneOwner || phoneOwner.id === user.id) {
          updateData.phoneNumber = normalizedPhone;
        } else if (
          !phoneOwner.drupalUserId ||
          phoneOwner.drupalUserId === drupalUserId
        ) {
          // Same person: phone account exists — link Drupal ID to that record.
          user = await prisma.user.update({
            where: { id: phoneOwner.id },
            data: {
              drupalUserId,
              ...(normalizedEmail ? { email: normalizedEmail } : {}),
              ...(profileData?.name ? { name: profileData.name } : {}),
              identifierType,
            },
          });
          return user;
        } else {
          console.warn(
            '[getCurrentUser] Profile phone already linked to another Drupal account; skipping phone sync',
            { drupalUserId, phoneNumber: normalizedPhone },
          );
        }
      }
      if (profileData?.name && user.name !== profileData.name) {
        updateData.name = profileData.name;
      }
      if (user.identifierType !== identifierType) {
        updateData.identifierType = identifierType;
      }

      if (Object.keys(updateData).length > 0) {
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        } catch (error) {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'P2002'
          ) {
            console.warn(
              '[getCurrentUser] Unique constraint on profile sync; returning existing user record',
              error,
            );
          } else {
            throw error;
          }
        }
      }
    }

    if (!user) {
      throw new AuthenticationError('Unable to resolve user account');
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    if (isAuthenticationError(error)) {
      throw error;
    }
    throw new AuthenticationError('Failed to authenticate user');
  }
}

export async function getApplications() {
  try {
    const user = await getCurrentUser();

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        groupData: true,
        members: true,
        loanConditions: true,
        proposedBusiness: {
          include: {
            customExpenses: true,
          },
        },
        confirmations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map(transformApplicationFromDb);
  } catch (error) {
    if (isAuthenticationError(error)) {
      throw error;
    }
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

export async function getApplicationById(id: string) {
  try {
    const user = await getCurrentUser();

    const application = await prisma.application.findUnique({
      where: { applicationId: id },
      include: {
        groupData: true,
        members: true,
        loanConditions: true,
        proposedBusiness: {
          include: {
            customExpenses: true,
          },
        },
        confirmations: true,
      },
    });

    if (!application) {
      return undefined;
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      return undefined; // Return undefined instead of throwing error for getById
    }

    return transformApplicationFromDb(application);
  } catch (error) {
    if (isAuthenticationError(error)) {
      throw error;
    }
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

export async function createApplication() {
  try {
    const user = await getCurrentUser();

    const applicationId = createApplicationId();

    const application = await prisma.application.create({
      data: {
        applicationId,
        userId: user.id,
        status: ApplicationStatus.UNSUBMITTED,
        applicationProgress: 1,
        syncStatus: SyncStatus.PENDING,
      },
    });

    const generalDetails: GeneralDetails = {
      applicationId: application.applicationId,
      status: application.status as any,
      user: user.email || user.phoneNumber || user.name || user.id,
      applicationProgress: application.applicationProgress,
    };

    return generalDetails;
  } catch (error) {
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

export async function updateApplicationGroupData(id: string, data: GroupData) {
  try {
    const user = await getCurrentUser();

    const application = await prisma.application.findUnique({
      where: { applicationId: id },
      include: { groupData: true },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    // Prepare data for JSON storage (files are already processed by the action)
    // Convert file objects to JSON for database storage
    const groupRegistrationCertificateJson = isFileUpload(
      data.basics.groupRegistrationCertificate,
    )
      ? {} // This should not happen since files are processed in the action
      : (data.basics.groupRegistrationCertificate as Record<string, any>);

    const listOfMembersOnCertificateJson = isFileUpload(
      data.basics.listOfMembersOnCertificate,
    )
      ? {} // This should not happen since files are processed in the action
      : (data.basics.listOfMembersOnCertificate as Record<string, any>);

    const groupMeetingMinutesJson = Array.isArray(
      data.basics.groupMeetingMinutes,
    )
      ? data.basics.groupMeetingMinutes.map((file) =>
          isFileUpload(file) ? {} : (file as Record<string, any>),
        )
      : (data.basics.groupMeetingMinutes as Record<string, any>);

    const groupCreditHistoryJson = Array.isArray(
      data.background.groupCreditHistory,
    )
      ? data.background.groupCreditHistory.map((file) =>
          isFileUpload(file) ? {} : (file as Record<string, any>),
        )
      : (data.background.groupCreditHistory as Record<string, any>);

    const groupDataToSave = {
      groupName: data.basics.groupName,
      groupRegistrationNumber: data.basics.groupRegistrationNumber,
      dateFormed: new Date(data.basics.dateFormed),
      groupRegistrationCertificate: safeJsonStringify(
        groupRegistrationCertificateJson,
      ),
      listOfMembersOnCertificate: safeJsonStringify(
        listOfMembersOnCertificateJson,
      ),
      groupMeetingMinutes: safeJsonStringify(groupMeetingMinutesJson),
      purposeOfTheGroup: safeJsonStringify(data.background.purposeOfTheGroup),
      keyActivitiesOfTheGroup: safeJsonStringify(
        data.background.keyActivitiesOfTheGroup,
      ),
      groupCreditHistory: safeJsonStringify(groupCreditHistoryJson),
      other: data.background.other,
      valueChain: data.background.valueChain
        ? safeJsonStringify(data.background.valueChain)
        : undefined,
      tableBankingExperience:
        data.background.tableBanking?.tableBankingExperience,
      tableBankingShareContribution:
        data.background.tableBanking?.tableBankingShareContribution,
      tableBankingTotalLoanedOut:
        data.background.tableBanking?.tableBankingTotalLoanedOut,
      tableBankingTotalRevolvingFund:
        data.background.tableBanking?.tableBankingTotalRevolvingFund,
      countyOfOperation: data.location.countyOfOperation,
      constituency: data.location.constituency,
      ward: data.location.ward,
      meetingPoint: data.location.meetingPoint,
      nearestLandmark: data.location.nearestLandmark,
    };

    // Update or create group data
    if (application.groupData) {
      await prisma.groupData.update({
        where: { id: application.groupData.id },
        data: groupDataToSave,
      });
    } else {
      await prisma.groupData.create({
        data: {
          ...groupDataToSave,
          applicationId: application.id,
        },
      });
    }

    // Update application progress
    const currentProgress = application.applicationProgress;
    await prisma.application.update({
      where: { id: application.id },
      data: {
        applicationProgress:
          currentProgress && currentProgress > 2 ? currentProgress : 2,
        syncStatus: SyncStatus.PENDING,
      },
    });

    return getApplicationById(id);
  } catch (error) {
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

// Update the updateApplicationMembersData function
export async function updateApplicationMembersData(
  id: string,
  data: MembersData,
) {
  try {
    const user = await getCurrentUser();

    const application = await prisma.application.findUnique({
      where: { applicationId: id },
      include: { members: true },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    const existingMembers = application.members || [];

    // Validate phone number and national ID uniqueness before processing
    const phoneNumberMap = new Map<string, string>(); // phoneNumber -> nationalIdCode
    const nationalIdMap = new Map<string, string>(); // nationalIdCode -> nationalIdCode (for tracking)

    // Track phone numbers and national IDs from existing members
    existingMembers.forEach((member) => {
      const normalizedPhone = normalizePhone(member.phoneNumber);
      if (normalizedPhone) {
        phoneNumberMap.set(normalizedPhone, member.nationalIdCode);
      }
      if (member.nationalIdCode) {
        nationalIdMap.set(member.nationalIdCode, member.nationalIdCode);
      }
    });

    // Check for duplicate phone numbers and national IDs in the incoming data
    const incomingPhoneNumbers = new Set<string>();
    const incomingNationalIds = new Set<string>();
    const duplicateErrors: string[] = [];

    for (const member of data.members) {
      // Check for duplicate phone numbers
      if (member.phoneNumber) {
        const normalizedPhone = normalizePhone(member.phoneNumber);
        if (!normalizedPhone) {
          continue;
        }

        // Check for duplicates within the incoming data
        if (incomingPhoneNumbers.has(normalizedPhone)) {
          duplicateErrors.push(
            `Phone number ${normalizedPhone} is used by multiple members in your current changes.`,
          );
          continue;
        }
        incomingPhoneNumbers.add(normalizedPhone);

        // Check if phone number exists in other existing members
        const existingMemberWithSamePhone = phoneNumberMap.get(normalizedPhone);
        if (
          existingMemberWithSamePhone &&
          existingMemberWithSamePhone !== member.nationalIdCode
        ) {
          const conflictingMember = existingMembers.find(
            (existing) =>
              normalizePhone(existing.phoneNumber) === normalizedPhone,
          );
          duplicateErrors.push(
            conflictingMember?.fullname
              ? `Phone number ${normalizedPhone} is already used by ${conflictingMember.fullname}. Each member must have a unique phone number.`
              : `Phone number ${normalizedPhone} is already used by another member in this group.`,
          );
        }
      }

      // Check for duplicate national IDs
      if (member.nationalIdCode) {
        // Check for duplicates within the incoming data
        if (incomingNationalIds.has(member.nationalIdCode)) {
          duplicateErrors.push(
            `National ID ${member.nationalIdCode} is used by multiple members in your current changes.`,
          );
          continue;
        }
        incomingNationalIds.add(member.nationalIdCode);

        // Check if national ID exists in other existing members
        const existingMemberWithSameNationalId = nationalIdMap.get(
          member.nationalIdCode,
        );
        if (
          existingMemberWithSameNationalId &&
          existingMemberWithSameNationalId !== member.nationalIdCode
        ) {
          duplicateErrors.push(
            `National ID ${member.nationalIdCode} is already used by another member in this group.`,
          );
        }
      }
    }

    // If there are duplicate errors, throw them before processing
    if (duplicateErrors.length > 0) {
      throw new Error(`Validation failed: ${duplicateErrors.join(' ')}`);
    }

    // Process members - update existing ones and create new ones
    const memberUpdates: Promise<any>[] = [];
    const newMembers: any[] = [];

    for (const member of data.members) {
      // Check if this member already exists
      const existingMember = existingMembers.find(
        (existing) => existing.nationalIdCode === member.nationalIdCode,
      );

      if (existingMember) {
        // Check if phone number has changed
        const phoneNumberChanged =
          existingMember.phoneNumber !== member.phoneNumber;

        // Prepare base update data
        const updateData: any = {
          natureOfTheGroup: data.natureOfTheGroup,
          fullname: member.fullname || '',
          nationalIdCode: member.nationalIdCode || '',
          gender: member.gender as any,
          type: member.type as any,
          phoneNumber: normalizePhone(member.phoneNumber || '') || '',
          economicActivity: member.economicActivity || '',
          photoOfId: safeJsonStringify((member.photoOfId as any) || {}),
          certificateOfDisability: member.disability?.certificateOfDisability
            ? safeJsonStringify(
                member.disability.certificateOfDisability as any,
              )
            : null,
          pwdNumber: member.disability?.pwdNumber || null,
        };

        // If phone number changed, reset confirmation data
        if (phoneNumberChanged) {
          updateData.status = MemberStatus.PENDING;
          updateData.requiresConfirmation = true;
          updateData.confirmation_status = 'pending';
          updateData.confirmation_token = null;
          updateData.confirmation_sent_at = null;
          updateData.confirmation_confirmed_at = null;
          updateData.confirmation_token_expires_at = null;
        } else {
          // Preserve existing confirmation data if phone number didn't change
          updateData.status = existingMember.status;
          updateData.requiresConfirmation = existingMember.requiresConfirmation;
          updateData.confirmation_status = existingMember.confirmation_status;
          updateData.confirmation_token = existingMember.confirmation_token;
          updateData.confirmation_sent_at = existingMember.confirmation_sent_at;
          updateData.confirmation_confirmed_at =
            existingMember.confirmation_confirmed_at;
          updateData.confirmation_token_expires_at =
            existingMember.confirmation_token_expires_at;
        }

        memberUpdates.push(
          prisma.memberData.update({
            where: { id: existingMember.id },
            data: updateData,
          }),
        );
      } else {
        // Create new member with default confirmation status
        newMembers.push({
          applicationId: application.id,
          natureOfTheGroup: data.natureOfTheGroup,
          fullname: member.fullname || '',
          nationalIdCode: member.nationalIdCode || '',
          gender: member.gender as any,
          type: member.type as any,
          economicActivity: member.economicActivity || '',
          phoneNumber: normalizePhone(member.phoneNumber || '') || '',
          photoOfId: safeJsonStringify((member.photoOfId as any) || {}),
          certificateOfDisability: member.disability?.certificateOfDisability
            ? safeJsonStringify(
                member.disability.certificateOfDisability as any,
              )
            : null,
          pwdNumber: member.disability?.pwdNumber || null,
          status: MemberStatus.PENDING,
          requiresConfirmation: true,
          // New members get default confirmation values
          confirmation_status: 'pending',
          confirmation_token: null,
          confirmation_sent_at: null,
          confirmation_confirmed_at: null,
          confirmation_token_expires_at: null,
        });
      }
    }

    // Identify members that were removed
    const removedMemberIds = existingMembers
      .filter(
        (existing) =>
          !data.members.some(
            (member) => member.nationalIdCode === existing.nationalIdCode,
          ),
      )
      .map((member) => member.id);

    // Execute all operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Update existing members
      if (memberUpdates.length > 0) {
        await Promise.all(memberUpdates);
      }

      // Create new members
      if (newMembers.length > 0) {
        await tx.memberData.createMany({
          data: newMembers,
        });
      }

      // Remove deleted members
      if (removedMemberIds.length > 0) {
        await tx.memberData.deleteMany({
          where: {
            id: { in: removedMemberIds },
          },
        });
      }
    });

    // Update application progress
    const currentProgress = application.applicationProgress;
    await prisma.application.update({
      where: { id: application.id },
      data: {
        applicationProgress:
          currentProgress && currentProgress > 3 ? currentProgress : 3,
        syncStatus: SyncStatus.PENDING,
      },
    });

    return getApplicationById(id);
  } catch (error) {
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

export async function updateApplicationLoanConditionsData(
  id: string,
  data: LoanConditionsData,
) {
  console.log('Updating loan conditions with data:', data);
  try {
    const user = await getCurrentUser();

    const application = await prisma.application.findUnique({
      where: { applicationId: id },
      include: { loanConditions: true },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    const loanConditionsData = {
      loanType: data.loanType,
      loanAmount: data.loanAmount,
      repaymentPeriod: data.repaymentPeriod,
      bankName: data.bankName,
      bankNameOther: data.bankNameOther || null,
      institutionType: data.institutionType, // 'bank' or 'sacco'
      bankBranch: data.bankBranch,
      accountNumber: data.accountNumber,
    };

    // Update or create loan conditions
    if (application.loanConditions) {
      await prisma.loanConditions.update({
        where: { id: application.loanConditions.id },
        data: loanConditionsData,
      });
    } else {
      await prisma.loanConditions.create({
        data: {
          ...loanConditionsData,
          applicationId: application.id,
        },
      });
    }

    // Update application progress
    const currentProgress = application.applicationProgress;
    await prisma.application.update({
      where: { id: application.id },
      data: {
        applicationProgress:
          currentProgress && currentProgress > 4 ? currentProgress : 4,
        syncStatus: SyncStatus.PENDING,
      },
    });

    return getApplicationById(id);
  } catch (error) {
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

export async function updateApplicationProposedBusinessData(
  id: string,
  data: ProposedBusinessData,
) {
  try {
    const user = await getCurrentUser();

    const application = await prisma.application.findUnique({
      where: { applicationId: id },
      include: {
        proposedBusiness: {
          include: {
            customExpenses: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    const proposedBusinessData = {
      natureOfBusiness: data.natureOfBusiness,
      businessType: safeJsonStringify(data.businessType),
      yearsInBusiness: data.yearsInBusiness,
      averageIncome: data.averageIncome,
      costOfGoods: data.costOfGoods,
      rentForBusiness: data.rentForBusiness,
      salaries: data.salaries,
      transportForBusinessStock: data.transportForBusinessStock,
    };

    let proposedBusinessId: string;

    // Update or create proposed business
    if (application.proposedBusiness) {
      await prisma.proposedBusiness.update({
        where: { id: application.proposedBusiness.id },
        data: proposedBusinessData,
      });
      proposedBusinessId = application.proposedBusiness.id;
    } else {
      const createdProposedBusiness = await prisma.proposedBusiness.create({
        data: {
          ...proposedBusinessData,
          applicationId: application.id,
        },
      });
      proposedBusinessId = createdProposedBusiness.id;
    }

    // Handle custom expenses
    if (data.customExpenses) {
      // Delete existing custom expenses
      await prisma.customExpense.deleteMany({
        where: { proposedBusinessId },
      });

      // Create new custom expenses
      if (data.customExpenses.length > 0) {
        await prisma.customExpense.createMany({
          data: data.customExpenses.map((expense) => ({
            proposedBusinessId,
            name: expense.name,
            amount: expense.amount,
          })),
        });
      }
    }

    // Update application progress
    const currentProgress = application.applicationProgress;
    await prisma.application.update({
      where: { id: application.id },
      data: {
        applicationProgress:
          currentProgress && currentProgress > 5 ? currentProgress : 5,
        syncStatus: SyncStatus.PENDING,
      },
    });

    return getApplicationById(id);
  } catch (error) {
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

export async function updateApplicationDeclarationsData(
  id: string,
  data: DeclarationsData,
) {
  try {
    const user = await getCurrentUser();

    const application = await prisma.application.findUnique({
      where: { applicationId: id },
      include: { confirmations: true },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    const confirmationsData = {
      membersConfirm: data.membersConfirm === 'on',
      correctInformationConfirm: data.correctInformationConfirm === 'on',
      liabilityConfirm: data.liabilityConfirm === 'on',
      fundsEligibleConfirm: data.fundsEligibleConfirm === 'on',
    };

    // Update or create confirmations
    if (application.confirmations) {
      await prisma.confirmations.update({
        where: { id: application.confirmations.id },
        data: confirmationsData,
      });
    } else {
      await prisma.confirmations.create({
        data: {
          ...confirmationsData,
          applicationId: application.id,
        },
      });
    }

    // Update application progress
    const currentProgress = application.applicationProgress;
    await prisma.application.update({
      where: { id: application.id },
      data: {
        applicationProgress:
          currentProgress && currentProgress > 7 ? currentProgress : 7,
        syncStatus: SyncStatus.PENDING,
      },
    });

    return getApplicationById(id);
  } catch (error) {
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

export async function updateApplicationMembersSMSConfirmation(id: string) {
  try {
    const application = await prisma.application.findUnique({
      where: { applicationId: id },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    const currentProgress = application.applicationProgress;
    await prisma.application.update({
      where: { id: application.id },
      data: {
        applicationProgress:
          currentProgress && currentProgress > 6 ? currentProgress : 6,
        syncStatus: SyncStatus.PENDING,
      },
    });
  } catch (error) {
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

export async function updateApplicationMembersConfirmationData(id: string) {
  try {
    const user = await getCurrentUser();

    const application = await prisma.application.findUnique({
      where: { applicationId: id },
      include: { members: true },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    const members = application.members || [];
    const passThreshold = Math.ceil(members.length * 0.7);

    // Update member statuses
    await Promise.all(
      members.map((member, index) =>
        prisma.memberData.update({
          where: { id: member.id },
          data: {
            status:
              index + 1 <= passThreshold
                ? MemberStatus.CONFIRMED
                : MemberStatus.PENDING,
          },
        }),
      ),
    );

    const updatedApplication = await getApplicationById(id);
    return updatedApplication?.members?.members;
  } catch (error) {
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

export async function updateApplicationStatus(
  id: string,
  status?: ApplicationStatus,
  applicationProgress?: number,
) {
  try {
    const user = await getCurrentUser();

    const application = await prisma.application.findUnique({
      where: { applicationId: id },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    const resolvedStatus = status || ApplicationStatus.SUBMITTED;
    const shouldQueueSync = resolvedStatus === ApplicationStatus.SUBMITTED;
    const drupalAlreadySynced =
      Boolean(application.externalId) &&
      application.syncStatus === SyncStatus.COMPLETED;
    const needsDrupalSync = shouldQueueSync && !drupalAlreadySynced;

    await prisma.application.update({
      where: { id: application.id },
      data: {
        status: resolvedStatus,
        applicationProgress: applicationProgress || 7,
        ...(needsDrupalSync ? { syncStatus: SyncStatus.PENDING } : {}),
      },
    });

    // Only queue Drupal sync when the application is not already in Drupal
    if (needsDrupalSync) {
      await addToSyncQueue(
        application.applicationId,
        application.externalId ? SyncAction.UPDATE : SyncAction.CREATE,
        {
          priority: true,
        },
      );
    }

    const updatedApplication = await getApplicationById(id);
    return updatedApplication?.generalDetails;
  } catch (error) {
    const { message } = handlePrismaError(error);
    throw new Error(message);
  }
}

function transformApplicationFromDb(dbApplication: any): ApplicationData {
  const generalDetails: GeneralDetails = {
    applicationId: dbApplication.applicationId,
    status: dbApplication.status,
    user: dbApplication.user?.email || '',
    applicationProgress: dbApplication.applicationProgress,
  };

  const result: ApplicationData = { generalDetails };

  // Transform group data
  if (dbApplication.groupData) {
    const gd = dbApplication.groupData;
    result.groupData = {
      basics: {
        groupName: gd.groupName ?? '',
        groupRegistrationNumber: gd.groupRegistrationNumber ?? '',
        dateFormed: gd.dateFormed
          ? gd.dateFormed.toISOString().split('T')[0]
          : '',
        groupRegistrationCertificate:
          typeof gd.groupRegistrationCertificate === 'string'
            ? safeParseJsonField(
                gd.groupRegistrationCertificate,
                gd.groupRegistrationCertificate,
              )
            : gd.groupRegistrationCertificate,
        listOfMembersOnCertificate:
          typeof gd.listOfMembersOnCertificate === 'string'
            ? safeParseJsonField(
                gd.listOfMembersOnCertificate,
                gd.listOfMembersOnCertificate,
              )
            : gd.listOfMembersOnCertificate,
        groupMeetingMinutes:
          typeof gd.groupMeetingMinutes === 'string'
            ? safeParseJsonField(gd.groupMeetingMinutes, [])
            : (gd.groupMeetingMinutes ?? []),
      },
      background: {
        purposeOfTheGroup: safeParseJsonField(gd.purposeOfTheGroup, []),
        keyActivitiesOfTheGroup: safeParseJsonField(
          gd.keyActivitiesOfTheGroup,
          [],
        ),
        groupCreditHistory: safeParseJsonField(gd.groupCreditHistory, []),
        other: gd.other,
        valueChain: gd.valueChain
          ? safeParseJsonField<string[]>(gd.valueChain, [])
          : null,
        tableBanking: {
          tableBankingExperience: gd.tableBankingExperience || undefined,
          tableBankingShareContribution:
            gd.tableBankingShareContribution || undefined,
          tableBankingTotalLoanedOut:
            gd.tableBankingTotalLoanedOut || undefined,
          tableBankingTotalRevolvingFund:
            gd.tableBankingTotalRevolvingFund || undefined,
        },
      },
      location: {
        countyOfOperation: gd.countyOfOperation,
        constituency: gd.constituency,
        ward: gd.ward,
        meetingPoint: gd.meetingPoint,
        nearestLandmark: gd.nearestLandmark,
      },
    };
  }

  // Transform members
  if (dbApplication.members && dbApplication.members.length > 0) {
    result.members = {
      natureOfTheGroup: dbApplication.members[0].natureOfTheGroup,
      members: dbApplication.members.map((m: any) => ({
        id: m.id,
        fullname: m.fullname,
        nationalIdCode: m.nationalIdCode,
        gender: m.gender,
        type: m.type,
        economicActivity: m.economicActivity,
        phoneNumber: m.phoneNumber,
        photoOfId:
          typeof m.photoOfId === 'string'
            ? JSON.parse(m.photoOfId)
            : m.photoOfId,
        disability: m.certificateOfDisability
          ? {
              certificateOfDisability:
                typeof m.certificateOfDisability === 'string'
                  ? JSON.parse(m.certificateOfDisability)
                  : m.certificateOfDisability,
              pwdNumber: m.pwdNumber,
            }
          : undefined,
        status: m.status.toLowerCase(),
        requiresConfirmation: m.requiresConfirmation || false,
        confirmation_status: m.confirmation_status,
        confirmation_token: m.confirmation_token,
        confirmation_sent_at: serializeDateField(m.confirmation_sent_at),
        confirmation_confirmed_at: serializeDateField(
          m.confirmation_confirmed_at,
        ),
        confirmation_token_expires_at: serializeDateField(
          m.confirmation_token_expires_at,
        ),
      })),
    };
  }

  // Transform loan conditions
  if (dbApplication.loanConditions) {
    const lc = dbApplication.loanConditions;
    result.loanConditions = {
      loanType: lc.loanType,
      loanAmount: lc.loanAmount,
      repaymentPeriod: lc.repaymentPeriod,
      institutionType: lc.institutionType,
      bankName: lc.bankName,
      bankNameOther: lc.bankNameOther,
      bankBranch: lc.bankBranch,
      accountNumber: lc.accountNumber,
    };
  }

  // Transform proposed business
  if (dbApplication.proposedBusiness) {
    const pb = dbApplication.proposedBusiness;
    result.proposedBusiness = {
      natureOfBusiness: pb.natureOfBusiness,
      businessType:
        typeof pb.businessType === 'string'
          ? JSON.parse(pb.businessType)
          : (pb.businessType as string[]),
      yearsInBusiness: pb.yearsInBusiness,
      averageIncome: pb.averageIncome,
      costOfGoods: pb.costOfGoods,
      rentForBusiness: pb.rentForBusiness,
      salaries: pb.salaries,
      transportForBusinessStock: pb.transportForBusinessStock,
      customExpenses:
        pb.customExpenses?.map((expense: any) => ({
          name: expense.name,
          amount: expense.amount,
        })) || [],
    };
  }

  // Transform confirmations
  if (dbApplication.confirmations) {
    const c = dbApplication.confirmations;
    result.confirmations = {
      declarations: {
        membersConfirm: c.membersConfirm ? 'on' : null,
        correctInformationConfirm: c.correctInformationConfirm ? 'on' : null,
        liabilityConfirm: c.liabilityConfirm ? 'on' : null,
        fundsEligibleConfirm: c.fundsEligibleConfirm ? 'on' : null,
      },
    };
  }

  return result;
}

/**
 * Check if a phone number already exists in the application (excluding a specific member)
 */
export async function checkPhoneNumberExistsInApplication(
  applicationId: string,
  phoneNumber: string,
  excludeNationalIdCode?: string,
): Promise<boolean> {
  const conflict = await getPhoneConflictInApplication(
    applicationId,
    phoneNumber,
    excludeNationalIdCode,
  );
  return conflict !== null;
}

export async function getPhoneConflictInApplication(
  applicationId: string,
  phoneNumber: string,
  excludeNationalIdCode?: string,
): Promise<{ fullname: string; phoneNumber: string } | null> {
  try {
    const application = await prisma.application.findUnique({
      where: { applicationId },
      include: { members: true },
    });

    if (!application) {
      return null;
    }

    const normalizedPhone = normalizePhone(phoneNumber);
    if (!normalizedPhone) {
      return null;
    }

    const existingMember = application.members.find(
      (member) =>
        normalizePhone(member.phoneNumber) === normalizedPhone &&
        member.nationalIdCode !== excludeNationalIdCode,
    );

    if (!existingMember) {
      return null;
    }

    return {
      fullname: existingMember.fullname,
      phoneNumber: normalizedPhone,
    };
  } catch (error) {
    console.error('Error checking phone number existence:', error);
    return null;
  }
}

/**
 * Check if a national ID number already exists in the application (excluding a specific member)
 */
export async function checkNationalIdExistsInApplication(
  applicationId: string,
  nationalIdCode: string,
  excludeNationalIdCode?: string,
): Promise<boolean> {
  try {
    const application = await prisma.application.findUnique({
      where: { applicationId },
      include: { members: true },
    });

    if (!application) {
      return false;
    }

    const existingMember = application.members.find(
      (member) =>
        member.nationalIdCode === nationalIdCode &&
        member.nationalIdCode !== excludeNationalIdCode,
    );

    return !!existingMember;
  } catch (error) {
    console.error('Error checking national ID existence:', error);
    return false;
  }
}
