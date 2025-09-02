'use server';

import { ApplicationStatus, MemberStatus } from '@/generated/prisma';
import { getApplicationsWithFallback } from '@/lib/api/application/list';
import type {
  ApplicationDetail,
  ApplicationsListQuery,
} from '@/lib/api/schema/application/applications-list.schema';
import type { ApplicationData } from '@/lib/types/application.types';
import { getApplications as getLocalApplications } from '@/lib/data/application';
import { prisma } from '@/lib/db/prisma';

/**
 * Maps API status to local ApplicationStatus enum
 */
function mapApiStatusToLocal(apiStatus?: string): ApplicationStatus {
  switch (apiStatus) {
    case 'draft':
      return ApplicationStatus.DRAFT;
    case 'submitted':
      return ApplicationStatus.SUBMITTED;
    case 'under_review':
      return ApplicationStatus.IN_REVIEW;
    case 'approved':
      return ApplicationStatus.APPROVED;
    case 'rejected':
      return ApplicationStatus.REJECTED;
    case 'disbursed':
      return ApplicationStatus.DISBURSED;
    case 'closed':
      return ApplicationStatus.CLOSED;
    default:
      return ApplicationStatus.DRAFT;
  }
}

/**
 * Helper function to safely convert timestamp to number
 */
function parseTimestamp(timestamp?: string | number): number {
  if (typeof timestamp === 'number') return timestamp;
  if (typeof timestamp === 'string') {
    const parsed = parseInt(timestamp, 10);
    return isNaN(parsed) ? Date.now() / 1000 : parsed;
  }
  return Date.now() / 1000;
}

/**
 * Helper function to safely convert string/number to number
 */
function parseNumber(value?: string | number | null): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Helper function to safely convert string/number to integer
 */
function parseInteger(value?: string | number | null): number | undefined {
  if (typeof value === 'number') return Math.round(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Helper function to safely convert file data to ValidFile format
 */
function parseFileData(
  fileData?: Record<string, unknown>,
): Record<string, unknown> {
  if (!fileData) return {};

  // If it's already a ValidFile object structure, return as is
  if (typeof fileData === 'object' && !fileData.fid) {
    return fileData;
  }

  // Convert API file data to ValidFile format
  return {
    fid:
      typeof fileData.fid === 'string'
        ? parseInt(fileData.fid as string, 10)
        : fileData.fid,
    filename: fileData.filename || fileData.originalName,
    url: fileData.url || fileData.uri,
  };
}

/**
 * Maps API ApplicationDetail to local ApplicationData format
 */
function mapApiApplicationToLocal(
  apiApp: ApplicationDetail,
): ApplicationData | null {
  if (!apiApp.application_id) return null;

  try {
    const result: ApplicationData = {
      generalDetails: {
        applicationId: apiApp.application_id,
        status: mapApiStatusToLocal(apiApp.status),
        user: apiApp.owner?.email || apiApp.owner?.name || '',
        applicationProgress: 5, // Assume completed if from API
        rejectionDetails: apiApp.rejection_details
          ? {
              rejectionReason: apiApp.rejection_details.rejection_reason,
              rejectionMessage: apiApp.rejection_details.rejection_message,
            }
          : undefined,
      },
    };

    // Transform group data
    if (apiApp.group_data) {
      const gd = apiApp.group_data;
      result.groupData = {
        basics: {
          groupName: gd.group_name || '',
          groupRegistrationNumber: gd.group_registration_number || '',
          dateFormed: (gd.date_registered ||
            new Date().toISOString().split('T')[0]) as string,
          groupRegistrationCertificate: parseFileData(
            gd.group_registration_certificate,
          ),
          listOfMembersOnCertificate: parseFileData(
            gd.list_of_members_certificate,
          ),
        },
        background: {
          purposeOfTheGroup: gd.group_background?.map((bg) => bg.name) || [],
          keyActivitiesOfTheGroup: gd.key_activities || [],
          groupCreditHistory: gd.group_credit_history?.map(parseFileData) || [],
          other: gd.other_activities,
          valueChain: gd.value_chain?.map((vc) => vc.name) || null,
          tableBanking: gd.table_banking_duration
            ? {
                tableBankingExperience: parseInteger(gd.table_banking_duration),
                tableBankingShareContribution: parseNumber(
                  gd.monthly_share_contribution,
                ),
                tableBankingTotalLoanedOut: parseNumber(gd.total_amount_loaned),
                tableBankingTotalRevolvingFund: parseNumber(
                  gd.total_revolving_fund,
                ),
              }
            : undefined,
        },
        location: {
          countyOfOperation: apiApp.location?.county?.name || '',
          constituency: apiApp.location?.constituency?.name || '',
          ward: apiApp.location?.ward || '',
          meetingPoint: apiApp.location?.meeting_point || '',
          nearestLandmark: apiApp.location?.nearest_landmark || '',
        },
      };
    }

    // Transform members
    if (apiApp.group_members && apiApp.group_members.length > 0) {
      result.members = {
        natureOfTheGroup: apiApp.nature_of_group || '',
        members: apiApp.group_members.map((member) => ({
          fullname: member.name || '',
          nationalIdCode: member.id_number || '',
          gender: (member.gender as 'Male' | 'Female' | 'Other') || 'Other',
          type:
            (member.position?.name as 'Chairman' | 'Secretary' | 'Member') ||
            'Member',
          phoneNumber: member.phone_number || '',
          photoOfId: parseFileData(member.photo_member_id),
          disability: member.person_with_disability
            ? {
                certificateOfDisability: parseFileData(
                  member.certificate_disability,
                ),
                pwdNumber: member.pwd_number || undefined,
              }
            : undefined,
          status: member.confirmation?.is_confirmed ? 'confirmed' : 'pending',
          requiresConfirmation: member.requires_confirmation || false,
        })),
      };
    }

    // Transform loan conditions
    if (apiApp.loan_conditions) {
      const lc = apiApp.loan_conditions;
      result.loanConditions = {
        loanType: lc.loan_type?.name || '',
        loanAmount: parseNumber(lc.loan_amount) || 0,
        repaymentPeriod: parseInteger(lc.proposed_repayment_period) || 0,
        bankName: lc.bank_name?.name || '',
        bankBranch: lc.bank_branch || '',
        accountNumber: lc.bank_account_number || '',
      };
    }

    // Transform proposed business
    if (apiApp.proposed_business) {
      const pb = apiApp.proposed_business;
      result.proposedBusiness = {
        natureOfBusiness: pb.nature_of_business || 'startup',
        businessType: pb.business_type?.map((bt) => bt.name) || [],
        yearsInBusiness: parseNumber(pb.years_in_operation) || 0,
        averageIncome: parseNumber(pb.average_income) || 0,
        costOfGoods: 0, // Not available in API
        rentForBusiness: 0, // Not available in API
        salaries: 0, // Not available in API
        transportForBusinessStock: 0, // Not available in API
        customExpenses:
          pb.expenses?.map((expense: Record<string, unknown>) => ({
            name: (expense.name as string) || 'Unknown',
            amount: parseNumber(expense.amount as string | number) || 0,
          })) || [],
      };
    }

    return result;
  } catch (error) {
    console.error('Error mapping API application to local format:', error);
    return null;
  }
}

/**
 * Maps API member confirmation status to local MemberStatus enum
 */
function mapApiMemberStatusToLocal(apiStatus?: string): MemberStatus {
  switch (apiStatus) {
    case 'confirmed':
      return MemberStatus.CONFIRMED;
    case 'pending':
    case 'sent':
    case 'failed':
    default:
      return MemberStatus.PENDING;
  }
}

/**
 * Sync application data changes from API to local database
 * This function checks for status changes, timestamp updates, and external ID updates
 * and syncs them to the local database
 */
async function syncApplicationDataChanges(
  apiApplications: ApplicationDetail[],
): Promise<void> {
  for (const apiApp of apiApplications) {
    if (!apiApp.application_id || !apiApp.status) continue;

    try {
      // Get the corresponding local application
      const localApp = await prisma.application.findUnique({
        where: { applicationId: apiApp.application_id },
      });

      if (!localApp) continue;

      const newStatus = mapApiStatusToLocal(apiApp.status);
      const apiUpdatedAt = apiApp.changed
        ? new Date(parseTimestamp(apiApp.changed) * 1000)
        : null;

      // Check if application status has changed or if there's a newer timestamp
      const needsUpdate =
        localApp.status !== newStatus ||
        (apiUpdatedAt && localApp.updatedAt < apiUpdatedAt);

      if (needsUpdate) {
        const changes: string[] = [];
        if (localApp.status !== newStatus) {
          changes.push(`status: ${localApp.status} -> ${newStatus}`);
        }
        if (apiUpdatedAt && localApp.updatedAt < apiUpdatedAt) {
          changes.push(
            `updated timestamp: ${localApp.updatedAt.toISOString()} -> ${apiUpdatedAt.toISOString()}`,
          );
        }

        console.log(
          `Syncing application data for ${apiApp.application_id}: ${changes.join(', ')}`,
        );

        await prisma.application.update({
          where: { id: localApp.id },
          data: {
            status: newStatus,
            updatedAt: apiUpdatedAt || new Date(),
            // Update external ID if available
            ...(apiApp.id && { externalId: String(apiApp.id) }),
          },
        });
      }
    } catch (error) {
      console.error(
        `Error syncing application status for ${apiApp.application_id}:`,
        error,
      );
    }
  }
}

/**
 * Sync member status changes from API to local database
 * This function checks for status changes in member confirmations and updates the local database
 */
async function syncMemberStatusChanges(
  apiApplications: ApplicationDetail[],
): Promise<void> {
  for (const apiApp of apiApplications) {
    if (!apiApp.application_id || !apiApp.group_members) continue;

    try {
      // Get the corresponding local application
      const localApp = await prisma.application.findUnique({
        where: { applicationId: apiApp.application_id },
        include: { members: true },
      });

      if (!localApp) continue;

      // Check each member for status changes
      for (const apiMember of apiApp.group_members) {
        if (!apiMember.phone_number || !apiMember.confirmation) continue;

        // Find the corresponding local member by phone number
        const localMember = localApp.members.find(
          (m) => m.phoneNumber === apiMember.phone_number,
        );

        if (!localMember) continue;

        // Check if confirmation status has changed
        const apiConfirmation = apiMember.confirmation;
        const newStatus = mapApiMemberStatusToLocal(apiConfirmation.status);

        // Only update if status actually changed
        // Use explicit enum comparison to avoid any type issues
        const currentStatus = localMember.status;
        const statusNeedsUpdate = currentStatus !== newStatus;

        if (statusNeedsUpdate) {
          console.log(
            `Syncing member confirmation status for ${apiMember.name} (${apiMember.phone_number}): ${currentStatus} -> ${newStatus} (API: "${apiConfirmation.status}")`,
          );

          await prisma.memberData.update({
            where: { id: localMember.id },
            data: {
              status: newStatus,
              updatedAt: apiConfirmation.confirmed_at
                ? new Date(parseTimestamp(apiConfirmation.confirmed_at) * 1000)
                : new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.error(
        `Error syncing member status for application ${apiApp.application_id}:`,
        error,
      );
    }
  }
}

/**
 * Get all applications combining API data (submitted+) with local data (drafts)
 * This function handles the fact that API only contains submitted and higher status applications
 * while local database contains all applications including drafts
 * @param query Optional query parameters for filtering
 * @returns Combined applications data in local format
 */
export async function getHybridApplications(
  query?: ApplicationsListQuery,
): Promise<ApplicationData[]> {
  try {
    // Always get local applications first (for drafts and fallback)
    const localApplications = await getLocalApplications();

    // Try to get API applications (submitted and higher statuses)
    let apiApplications: ApplicationDetail[] = [];
    let apiCallSuccessful = false;

    try {
      const apiResult = await getApplicationsWithFallback(query);

      if (apiResult.success && apiResult.data) {
        apiApplications = apiResult.data;
        apiCallSuccessful = true;

        // Sync application data changes from API to local database
        await syncApplicationDataChanges(apiApplications);

        // Sync member status changes from API to local database
        await syncMemberStatusChanges(apiApplications);
      }
    } catch (error) {
      console.warn('API call failed, using local data only:', error);
    }

    // If API call was successful, combine API data with local drafts
    if (apiCallSuccessful && apiApplications.length > 0) {
      // Get local draft applications that are not in the API response
      const apiApplicationIds = new Set(
        apiApplications.map((app) => app.application_id),
      );
      const localDraftApplications = localApplications.filter(
        (app) =>
          (app.generalDetails.status === ApplicationStatus.DRAFT ||
            app.generalDetails.status === ApplicationStatus.UNSUBMITTED) &&
          !apiApplicationIds.has(app.generalDetails.applicationId),
      );

      // Convert API applications to local format
      const mappedApiApplications = apiApplications
        .map(mapApiApplicationToLocal)
        .filter((app): app is ApplicationData => app !== null);

      // Combine API applications with local drafts
      const combinedApplications = [
        ...mappedApiApplications,
        ...localDraftApplications,
      ];

      // Sort by application ID (newest first, assuming APP-YYYYMMDD format)
      return combinedApplications.sort((a, b) =>
        b.generalDetails.applicationId.localeCompare(
          a.generalDetails.applicationId,
        ),
      );
    }

    // If API call failed or returned no data, return local applications only
    return localApplications;
  } catch (error) {
    console.error('Error in getHybridApplications:', error);

    // Fallback to local applications only
    try {
      return await getLocalApplications();
    } catch (localError) {
      console.error('Error getting local applications:', localError);
      return [];
    }
  }
}

/**
 * Get applications count with status breakdown
 * This includes both API and local applications
 */
export async function getApplicationsStats(): Promise<{
  total: number;
  draft: number;
  unsubmitted: number;
  submitted: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  disbursed: number;
  closed: number;
}> {
  try {
    const applications = await getHybridApplications();

    const stats = {
      total: applications.length,
      draft: 0,
      unsubmitted: 0,
      submitted: 0,
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      disbursed: 0,
      closed: 0,
    };

    applications.forEach((app) => {
      const status = app.generalDetails.status.toLowerCase();
      switch (status) {
        case 'draft':
          stats.draft++;
          break;
        case 'unsubmitted':
          stats.unsubmitted++;
          break;
        case 'submitted':
          stats.submitted++;
          break;
        case 'pending':
          stats.pending++;
          break;
        case 'in_review':
          stats.under_review++;
          break;
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'disbursed':
          stats.disbursed++;
          break;
        case 'closed':
          stats.closed++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting application stats:', error);
    return {
      total: 0,
      draft: 0,
      unsubmitted: 0,
      submitted: 0,
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      disbursed: 0,
      closed: 0,
    };
  }
}
