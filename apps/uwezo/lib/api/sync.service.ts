"use server";

import { ApplicationStatus, QueueStatus, SyncStatus } from "@/generated/prisma";
import type { ApplicationData } from "@/lib/data/application";
import { prisma } from "@/lib/db/prisma";

interface ExternalApiResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Process pending sync queue items
 */
export async function processSyncQueue() {
  try {
    // Get pending items scheduled for now or earlier
    const pendingItems = await prisma.syncQueue.findMany({
      where: {
        status: QueueStatus.PENDING,
        scheduledFor: {
          lte: new Date(),
        },
      },
      orderBy: {
        scheduledFor: "asc",
      },
      take: 10, // Process 10 items at a time
    });

    console.log(`Processing ${pendingItems.length} sync queue items...`);

    for (const item of pendingItems) {
      await processSyncItem(item.id);
    }

    return { processed: pendingItems.length };
  } catch (error) {
    console.error("Error processing sync queue:", error);
    throw error;
  }
}

/**
 * Process a single sync queue item
 */
async function processSyncItem(queueItemId: string) {
  try {
    // Mark as processing
    await prisma.syncQueue.update({
      where: { id: queueItemId },
      data: { status: QueueStatus.PROCESSING },
    });

    const queueItem = await prisma.syncQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new Error("Queue item not found");
    }

    // Get the full application data
    const application = await prisma.application.findUnique({
      where: { applicationId: queueItem.applicationId },
      include: {
        user: true,
        groupData: true,
        members: true,
        loanConditions: true,
        proposedBusiness: true,
        confirmations: true,
      },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    let result: ExternalApiResponse;

    switch (queueItem.action) {
      case "CREATE":
        result = await sendApplicationToExternalApi(application);
        break;
      case "UPDATE":
        result = await updateApplicationInExternalApi(application);
        break;
      case "DELETE":
        result = await deleteApplicationInExternalApi(
          application.applicationId,
        );
        break;
      default:
        throw new Error(`Unknown action: ${queueItem.action}`);
    }

    if (result.success) {
      // Mark sync as completed
      await prisma.syncQueue.update({
        where: { id: queueItemId },
        data: {
          status: QueueStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      // Update application sync status
      await prisma.application.update({
        where: { id: application.id },
        data: {
          syncStatus: SyncStatus.COMPLETED,
          lastSyncAt: new Date(),
          externalId: result.id || application.externalId,
          syncError: null,
        },
      });
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    console.error(`Error processing sync item ${queueItemId}:`, error);

    const queueItem = await prisma.syncQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) return;

    const attempts = queueItem.attempts + 1;
    const maxAttempts = queueItem.maxAttempts || 3;

    if (attempts >= maxAttempts) {
      // Mark as failed
      await prisma.syncQueue.update({
        where: { id: queueItemId },
        data: {
          status: QueueStatus.FAILED,
          attempts,
          error: error instanceof Error ? error.message : "Unknown error",
          processedAt: new Date(),
        },
      });

      // Update application sync status
      await prisma.application.update({
        where: { applicationId: queueItem.applicationId },
        data: {
          syncStatus: SyncStatus.FAILED,
          syncAttempts: attempts,
          syncError: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, attempts) * 5 * 60 * 1000; // 5min, 10min, 20min
      await prisma.syncQueue.update({
        where: { id: queueItemId },
        data: {
          status: QueueStatus.PENDING,
          attempts,
          scheduledFor: new Date(Date.now() + retryDelay),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
}

/**
 * Send application to external API
 */
async function sendApplicationToExternalApi(
  application: any,
): Promise<ExternalApiResponse> {
  try {
    const payload = transformApplicationForExternalApi(application);

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL}/applications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}`,
          "X-API-Secret": process.env.EXTERNAL_API_SECRET || "",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    const result = await response.json();
    return {
      success: true,
      id: result.id || result.application_id,
    };
  } catch (error) {
    console.error("Error sending application to external API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update application in external API
 */
async function updateApplicationInExternalApi(
  application: any,
): Promise<ExternalApiResponse> {
  try {
    if (!application.externalId) {
      // If no external ID, create instead
      return sendApplicationToExternalApi(application);
    }

    const payload = transformApplicationForExternalApi(application);

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL}/applications/${application.externalId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}`,
          "X-API-Secret": process.env.EXTERNAL_API_SECRET || "",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating application in external API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete application from external API
 */
async function deleteApplicationInExternalApi(
  applicationId: string,
): Promise<ExternalApiResponse> {
  try {
    const application = await prisma.application.findUnique({
      where: { applicationId },
    });

    if (!application?.externalId) {
      return { success: true }; // Nothing to delete
    }

    const response = await fetch(
      `${process.env.EXTERNAL_API_URL}/applications/${application.externalId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}`,
          "X-API-Secret": process.env.EXTERNAL_API_SECRET || "",
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting application from external API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Transform application data for external API
 */
function transformApplicationForExternalApi(application: any) {
  return {
    internal_id: application.applicationId,
    status: application.status,
    user_email: application.user.email,
    user_name: application.user.name,

    // Group data
    group: application.groupData
      ? {
          name: application.groupData.groupName,
          registration_number: application.groupData.groupRegistrationNumber,
          date_formed: application.groupData.dateFormed,
          purpose: application.groupData.purposeOfTheGroup,
          activities: application.groupData.keyActivitiesOfTheGroup,
          value_chain: application.groupData.valueChain,
          location: {
            county: application.groupData.countyOfOperation,
            constituency: application.groupData.constituency,
            ward: application.groupData.ward,
            meeting_point: application.groupData.meetingPoint,
            landmark: application.groupData.nearestLandmark,
          },
          table_banking: {
            experience: application.groupData.tableBankingExperience,
            share_contribution:
              application.groupData.tableBankingShareContribution,
            total_loaned: application.groupData.tableBankingTotalLoanedOut,
            revolving_fund:
              application.groupData.tableBankingTotalRevolvingFund,
          },
          documents: {
            registration_certificate:
              application.groupData.groupRegistrationCertificate,
            members_list: application.groupData.listOfMembersOnCertificate,
            credit_history: application.groupData.groupCreditHistory,
          },
        }
      : null,

    // Members
    members:
      application.members?.map((member: any) => ({
        name: member.fullname,
        id_number: member.nationalIdCode,
        gender: member.gender,
        position: member.type,
        phone: member.phoneNumber,
        status: member.status,
        disability: member.certificateOfDisability
          ? {
              certificate: member.certificateOfDisability,
              pwd_number: member.pwdNumber,
            }
          : null,
        photo_id: member.photoOfId,
      })) || [],

    // Loan details
    loan: application.loanConditions
      ? {
          purpose: application.loanConditions.purposeOfLoan,
          type: application.loanConditions.loanType,
          amount: application.loanConditions.loanAmount,
          repayment_period: application.loanConditions.repaymentPeriod,
          bank_details: {
            name: application.loanConditions.bankName,
            name_other: application.loanConditions.bankNameOther,
            branch: application.loanConditions.bankBranch,
            account_number: application.loanConditions.accountNumber,
          },
        }
      : null,

    // Business details
    business: application.proposedBusiness
      ? {
          nature: application.proposedBusiness.natureOfBusiness,
          type: application.proposedBusiness.businessType,
          years_in_business: application.proposedBusiness.yearsInBusiness,
          financials: {
            average_income: application.proposedBusiness.averageIncome,
            cost_of_goods: application.proposedBusiness.costOfGoods,
            rent: application.proposedBusiness.rentForBusiness,
            salaries: application.proposedBusiness.salaries,
            transport: application.proposedBusiness.transportForBusinessStock,
          },
        }
      : null,

    // Confirmations
    declarations: application.confirmations
      ? {
          members_confirm: application.confirmations.membersConfirm,
          correct_info: application.confirmations.correctInformationConfirm,
          liability: application.confirmations.liabilityConfirm,
          funds_eligible: application.confirmations.fundsEligibleConfirm,
        }
      : null,

    metadata: {
      created_at: application.createdAt,
      updated_at: application.updatedAt,
      progress: application.applicationProgress,
    },
  };
}

/**
 * Manually trigger sync for a specific application
 */
export async function syncApplication(applicationId: string) {
  try {
    const application = await prisma.application.findUnique({
      where: { applicationId },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    // Add to sync queue
    await prisma.syncQueue.create({
      data: {
        applicationId,
        action: application.externalId ? "UPDATE" : "CREATE",
        payload: {},
        status: QueueStatus.PENDING,
      },
    });

    // Process immediately
    await processSyncQueue();

    return { success: true };
  } catch (error) {
    console.error("Error syncing application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
