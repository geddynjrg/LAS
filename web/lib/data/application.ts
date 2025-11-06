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
import { isFileUpload } from '@workspace/ui/lib/utils';

// Helper function to safely store JSON data - prevents double encoding
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
  return phone.replace(/\s+/g, '');
}

// Helper function to get the current authenticated user
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    // Decode JWT to get Drupal user ID
    const tokenPayload = decodeJwtPayload(session);
    const drupalUserId = tokenPayload?.uid;

    if (!drupalUserId) {
      throw new Error('No Drupal user ID found in session token');
    }

    const profile = await getProfile();
    const profileData = profile.data;

    if (!profileData) {
      throw new Error('No profile data found');
    }

    // Helper function to determine identifier type based on priority
    const getIdentifierType = (): 'EMAIL' | 'PHONE' | 'NAME' => {
      if (profileData.email) return 'EMAIL';
      if (profileData.phoneNumber) return 'PHONE';
      if (profileData.name) return 'NAME';
      throw new Error('No valid user identifier found in profile');
    };

    const identifierType = getIdentifierType();

    // Find or create user by Drupal user ID
    let user = await prisma.user.findUnique({
      where: { drupalUserId },
    });

    // Create new user if not found
    if (!user) {
      user = await prisma.user.create({
        data: {
          drupalUserId,
          email: profileData.email,
          phoneNumber: normalizePhone(profileData.phoneNumber),
          name:
            profileData.name ||
            profileData.email ||
            profileData.phoneNumber ||
            'Unknown User',
          identifierType: identifierType,
        },
      });
    } else {
      // Update existing user with any new information from profile
      const updateData: any = {};

      // Always set drupalUserId if missing (migration case)
      if (!user.drupalUserId) {
        updateData.drupalUserId = drupalUserId;
      }

      if (profileData.email && user.email !== profileData.email)
        updateData.email = profileData.email;
      if (
        profileData.phoneNumber &&
        normalizePhone(user.phoneNumber) !==
          normalizePhone(profileData.phoneNumber)
      )
        updateData.phoneNumber = normalizePhone(profileData.phoneNumber);
      if (profileData.name && user.name !== profileData.name)
        updateData.name = profileData.name;

      // Update identifierType if it has changed
      if (!user.identifierType || user.identifierType !== identifierType) {
        updateData.identifierType = identifierType;
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);

    // Re-throw authentication errors as-is so they can be handled properly
    if (isAuthenticationError(error)) {
      throw error;
    }

    throw new Error('Failed to authenticate user');
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

export async function updateApplicationMembersData(
  id: string,
  data: MembersData,
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

    // Delete existing members
    await prisma.memberData.deleteMany({
      where: { applicationId: application.id },
    });

    // Create new members
    const membersToCreate = await Promise.all(
      data.members.map(async (member) => ({
        applicationId: application.id,
        natureOfTheGroup: data.natureOfTheGroup,
        fullname: member.fullname || '',
        nationalIdCode: member.nationalIdCode || '',
        gender: member.gender as any,
        type: member.type as any,
        phoneNumber: member.phoneNumber || '',
        photoOfId: safeJsonStringify((member.photoOfId as any) || {}),
        certificateOfDisability: member.disability?.certificateOfDisability
          ? safeJsonStringify(member.disability.certificateOfDisability as any)
          : null,
        pwdNumber: member.disability?.pwdNumber || null,
        status:
          member.status === 'confirmed'
            ? MemberStatus.CONFIRMED
            : MemberStatus.PENDING,
        requiresConfirmation: true,
      })),
    );

    await prisma.memberData.createMany({
      data: membersToCreate,
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
      bankNameOther: data.bankNameOther,
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
          currentProgress && currentProgress > 6 ? currentProgress : 6,
        syncStatus: SyncStatus.PENDING,
      },
    });

    return getApplicationById(id);
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

    await prisma.application.update({
      where: { id: application.id },
      data: {
        status: status || ApplicationStatus.SUBMITTED,
        applicationProgress: 7,
        syncStatus: SyncStatus.PENDING,
      },
    });

    // Add to sync queue using the helper function
    await addToSyncQueue(
      application.applicationId,
      SyncAction.CREATE,
      { priority: true }, // Prioritize status updates
    );

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
        groupName: gd.groupName,
        groupRegistrationNumber: gd.groupRegistrationNumber,
        dateFormed: gd.dateFormed.toISOString().split('T')[0],
        groupRegistrationCertificate:
          typeof gd.groupRegistrationCertificate === 'string'
            ? JSON.parse(gd.groupRegistrationCertificate)
            : gd.groupRegistrationCertificate,
        listOfMembersOnCertificate:
          typeof gd.listOfMembersOnCertificate === 'string'
            ? JSON.parse(gd.listOfMembersOnCertificate)
            : gd.listOfMembersOnCertificate,
      },
      background: {
        purposeOfTheGroup:
          typeof gd.purposeOfTheGroup === 'string'
            ? JSON.parse(gd.purposeOfTheGroup)
            : (gd.purposeOfTheGroup as string[]),
        keyActivitiesOfTheGroup:
          typeof gd.keyActivitiesOfTheGroup === 'string'
            ? JSON.parse(gd.keyActivitiesOfTheGroup)
            : (gd.keyActivitiesOfTheGroup as string[]),
        groupCreditHistory:
          typeof gd.groupCreditHistory === 'string'
            ? JSON.parse(gd.groupCreditHistory)
            : gd.groupCreditHistory,
        other: gd.other,
        valueChain: gd.valueChain
          ? typeof gd.valueChain === 'string'
            ? JSON.parse(gd.valueChain)
            : (gd.valueChain as string[])
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
        fullname: m.fullname,
        nationalIdCode: m.nationalIdCode,
        gender: m.gender,
        type: m.type,
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
