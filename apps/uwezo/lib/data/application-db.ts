"use server";

import { isFileUpload } from "@workspace/ui/lib/utils";

import {
  ApplicationStatus,
  MemberStatus,
  QueueStatus,
  SyncAction,
  SyncStatus,
} from "@/generated/prisma";
import { getProfile } from "@/lib/api/profile";
import type {
  ApplicationData,
  DeclarationsData,
  GeneralDetails,
  GroupData,
  LoanConditionsData,
  MembersData,
  ProposedBusinessData,
} from "@/lib/data/application";
import { handlePrismaError, prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/session";
import { createApplicationId } from "@/lib/util";

// Helper function to get the current authenticated user
async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const profile = await getProfile();
    const userEmail = profile.data?.email;

    if (!userEmail) {
      throw new Error("User email not found in profile");
    }

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: profile.data?.name || userEmail,
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    throw new Error("Failed to authenticate user");
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
        proposedBusiness: true,
        confirmations: true,
      },
      orderBy: { createdAt: "desc" },
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
        proposedBusiness: true,
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
      user: user.email,
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
      throw new Error("Application not found");
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
      groupRegistrationCertificate: groupRegistrationCertificateJson,
      listOfMembersOnCertificate: listOfMembersOnCertificateJson,
      purposeOfTheGroup: data.background.purposeOfTheGroup,
      keyActivitiesOfTheGroup: data.background.keyActivitiesOfTheGroup,
      groupCreditHistory: groupCreditHistoryJson,
      other: data.background.other,
      valueChain: data.background.valueChain || undefined,
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
      throw new Error("Application not found");
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
        fullname: member.fullname || "",
        nationalIdCode: member.nationalIdCode || "",
        gender: member.gender as any,
        type: member.type as any,
        phoneNumber: member.phoneNumber || "",
        photoOfId: (member.photoOfId as any) || {},
        certificateOfDisability:
          (member.disability?.certificateOfDisability as any) || null,
        pwdNumber: member.disability?.pwdNumber || null,
        status:
          member.status === "confirmed"
            ? MemberStatus.CONFIRMED
            : MemberStatus.PENDING,
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
      throw new Error("Application not found");
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    const loanConditionsData = {
      purposeOfLoan: data.purposeOfLoan,
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
      include: { proposedBusiness: true },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    const proposedBusinessData = {
      natureOfBusiness: data.natureOfBusiness,
      businessType: data.businessType,
      yearsInBusiness: data.yearsInBusiness,
      averageIncome: data.averageIncome,
      costOfGoods: data.costOfGoods,
      rentForBusiness: data.rentForBusiness,
      salaries: data.salaries,
      transportForBusinessStock: data.transportForBusinessStock,
    };

    // Update or create proposed business
    if (application.proposedBusiness) {
      await prisma.proposedBusiness.update({
        where: { id: application.proposedBusiness.id },
        data: proposedBusinessData,
      });
    } else {
      await prisma.proposedBusiness.create({
        data: {
          ...proposedBusinessData,
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
      throw new Error("Application not found");
    }

    // Check if user owns the application
    if (application.userId !== user.id) {
      throw new Error("Access denied: You don't own this application");
    }

    const confirmationsData = {
      membersConfirm: data.membersConfirm === "on",
      correctInformationConfirm: data.correctInformationConfirm === "on",
      liabilityConfirm: data.liabilityConfirm === "on",
      fundsEligibleConfirm: data.fundsEligibleConfirm === "on",
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
      throw new Error("Application not found");
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
      throw new Error("Application not found");
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

    // Add to sync queue
    await prisma.syncQueue.create({
      data: {
        applicationId: application.applicationId,
        action: SyncAction.CREATE,
        payload: {},
        status: QueueStatus.PENDING,
      },
    });

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
    user: dbApplication.user?.email || "",
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
        dateFormed: gd.dateFormed.toISOString().split("T")[0],
        groupRegistrationCertificate: gd.groupRegistrationCertificate,
        listOfMembersOnCertificate: gd.listOfMembersOnCertificate,
      },
      background: {
        purposeOfTheGroup: gd.purposeOfTheGroup as string[],
        keyActivitiesOfTheGroup: gd.keyActivitiesOfTheGroup as string[],
        groupCreditHistory: gd.groupCreditHistory,
        other: gd.other,
        valueChain: gd.valueChain as string[] | null,
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
        photoOfId: m.photoOfId,
        disability: m.certificateOfDisability
          ? {
              certificateOfDisability: m.certificateOfDisability,
              pwdNumber: m.pwdNumber,
            }
          : undefined,
        status: m.status.toLowerCase(),
      })),
    };
  }

  // Transform loan conditions
  if (dbApplication.loanConditions) {
    const lc = dbApplication.loanConditions;
    result.loanConditions = {
      purposeOfLoan: lc.purposeOfLoan as string[],
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
      businessType: pb.businessType as string[],
      yearsInBusiness: pb.yearsInBusiness,
      averageIncome: pb.averageIncome,
      costOfGoods: pb.costOfGoods,
      rentForBusiness: pb.rentForBusiness,
      salaries: pb.salaries,
      transportForBusinessStock: pb.transportForBusinessStock,
    };
  }

  // Transform confirmations
  if (dbApplication.confirmations) {
    const c = dbApplication.confirmations;
    result.confirmations = {
      declarations: {
        membersConfirm: c.membersConfirm ? "on" : null,
        correctInformationConfirm: c.correctInformationConfirm ? "on" : null,
        liabilityConfirm: c.liabilityConfirm ? "on" : null,
        fundsEligibleConfirm: c.fundsEligibleConfirm ? "on" : null,
      },
    };
  }

  return result;
}
