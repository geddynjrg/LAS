'use server';

import {
  ApplicationStatus,
  LmsSyncStatus,
  QueueStatus,
  SyncAction,
  SyncStatus,
} from '@/generated/prisma';
import {
  createOrUpdateApplication,
  sendToLms,
} from '@/lib/api/application/create';
import type {
  ApplicationPostRequest,
  FileUpload,
} from '@/lib/api/schema/application/application.schema';
import { toApiStatus } from '@/lib/constants/application-status';
import { prisma } from '@/lib/db/prisma';
import { promises as fs } from 'fs';
import path from 'path';

interface ExternalApiResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface QueueFilters {
  status?: QueueStatus[];
  applicationId?: string;
  action?: SyncAction;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface QueueStatistics {
  total: number;
  byStatus: Record<QueueStatus, number>;
  byAction: Record<SyncAction, number>;
  averageProcessingTime: number;
  successRate: number;
  oldestPending?: Date;
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
        scheduledFor: 'asc',
      },
      take: 10,
    });

    for (const item of pendingItems) {
      console.log('Processing sync queue item:', item.id);
      await processSyncItem(item.id);
      console.log('Processed sync queue item:', item.id);
    }
    console.log('ready to process lms que');
    await processLmsQueue();
    console.log('finished processing lms que');
    return { processed: pendingItems.length };
  } catch (error) {
    console.error('Error processing sync queue:', error);
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
      throw new Error('Queue item not found');
    }

    // Get the full application data
    const application = await prisma.application.findUnique({
      where: { applicationId: queueItem.applicationId },
      include: {
        user: true,
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
      throw new Error('Application not found');
    }

    let result: ExternalApiResponse;
    const payload = await transformApplicationForExternalApi(application);

    switch (queueItem.action) {
      case 'CREATE':
        console.log(
          'Creating application in external API:',
          application.applicationId,
        );
        result = await sendApplicationToExternalApi(payload);
        break;
      case 'UPDATE':
        console.log(
          'Updating application in external API:',
          application.applicationId,
        );

        if (!application.externalId) {
          // If no external ID, create instead
          result = await sendApplicationToExternalApi(payload);
        } else {
          // include the application_id in the payload
          payload.application_id = application.externalId;
          result = await updateApplicationInExternalApi(payload);
        }
        break;
      case 'DELETE':
        console.log(
          'Deleting application in external API:',
          application.applicationId,
        );
        if (!application?.externalId) {
          result = { success: true }; // Nothing to delete
        } else {
          payload.application_id = application.externalId;
          payload.status = 'closed';
          result = await deleteApplicationInExternalApi(payload);
        }

        break;
      default:
        throw new Error(`Unknown action: ${queueItem.action}`);
    }

    if (result.success) {
      console.log('Creating application in lms API:');
      await prisma.$transaction(async (tx) => {
        await tx.application.update({
          where: { id: application.id },
          data: {
            lmsSyncStatus: 'PENDING',
            lmsSyncAttempts: 0,
            lmsSyncError: null,
          },
        });

        // Mark sync as completed
        await tx.syncQueue.update({
          where: { id: queueItemId },
          data: {
            status: QueueStatus.COMPLETED,
            processedAt: new Date(),
          },
        });

        // Update application sync status (backend)
        await tx.application.update({
          where: { id: application.id },
          data: {
            syncStatus: SyncStatus.COMPLETED,
            lastSyncAt: new Date(),
            externalId: result.id || application.externalId,
            syncError: null,
          },
        });
      });

      // Now send to LMS
      let lmsSuccess = false;
      const lmsErrorMsg: string | null = null;

      try {
        const lmsResult = await sendApplicationToLmsApi(payload);
        if (lmsResult.success) {
          lmsSuccess = true;
          await prisma.application.update({
            where: { id: application.id },
            data: {
              lmsSyncStatus: 'COMPLETED',
              lmsReferenceId: lmsResult?.id || null,
              lmsLastSyncAt: new Date(),
              lmsSyncError: null,
              lmsSyncAttempts: 1,
            },
          });
        } else {
          // Queue for retry
          console.log('lms error result:', lmsResult);
          await queueLmsRetry(
            application.applicationId,
            queueItem.id,
            payload,
            lmsResult.error,
          );
        }
      } catch (err) {
        // Queue for retry on error too
        await queueLmsRetry(
          application.applicationId,
          queueItem.id,
          payload,
          err,
        );
        throw err;
      }
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error(`Error processing sync item ${queueItemId}:`, error);

    const queueItem = await prisma.syncQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) return;

    const attempts = queueItem.attempts + 1;
    const maxAttempts = queueItem.maxAttempts || 3;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Check if this is a permanent error that shouldn't be retried
    const isPermanentError =
      errorMessage.includes('not found') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('unauthorized');

    if (attempts >= maxAttempts || isPermanentError) {
      // Mark as failed
      await prisma.syncQueue.update({
        where: { id: queueItemId },
        data: {
          status: QueueStatus.FAILED,
          attempts,
          error: errorMessage,
          processedAt: new Date(),
        },
      });

      // Update application sync status
      await prisma.application.update({
        where: { applicationId: queueItem.applicationId },
        data: {
          syncStatus: SyncStatus.FAILED,
          syncAttempts: attempts,
          syncError: errorMessage,
        },
      });
    } else {
      // Schedule retry with exponential backoff
      const baseDelay = 5 * 60 * 1000; // 5 minutes
      const retryDelay = Math.min(
        baseDelay * Math.pow(2, attempts - 1),
        24 * 60 * 60 * 1000, // Max 24 hours
      );

      await prisma.syncQueue.update({
        where: { id: queueItemId },
        data: {
          status: QueueStatus.PENDING,
          attempts,
          scheduledFor: new Date(Date.now() + retryDelay),
          error: errorMessage,
        },
      });
    }
  }
}

// Helper function to queue LMS retry
async function queueLmsRetry(
  applicationId: string,
  syncQueueId: string,
  payload: any,
  error?: any,
) {
  const errorMsg = error instanceof Error ? error.message : 'Unknown LMS error: ' + String(error);

  const lmsSyncQueue = await prisma.lmsSyncQueue.upsert({
    where: { applicationId },
    update: {
      syncQueueId,
      payload,
      status: 'PENDING',
      attempts: 0,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      lastAttemptAt: new Date(),
      error: errorMsg,
    },
    create: {
      applicationId,
      syncQueueId,
      payload,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 5,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      lastAttemptAt: new Date(),
      error: errorMsg,
    },
  });

  console.log('LMS sync queued for retry:', lmsSyncQueue);

  // Also update application status
  await prisma.application.update({
    where: { applicationId },
    data: {
      lmsSyncStatus: 'PENDING',
      lmsSyncError: errorMsg,
      lmsLastSyncAt: new Date(),
      lmsSyncAttempts: 1,
    },
  });
}

/**
 * Send application to external API
 */
async function sendApplicationToExternalApi(
  payload: any,
): Promise<ExternalApiResponse> {
  try {
    const result = await createOrUpdateApplication(payload);

    if ('error' in result && result.error) {
      throw new Error(result.message || result.error || 'Unknown error');
    }

    // Check if it's a successful response
    if (
      'success' in result &&
      result.success &&
      'data' in result &&
      result.data
    ) {
      return {
        success: true,
        id: result.data.application_id,
      };
    }

    // Handle other successful responses without explicit success field
    if ('data' in result && result.data) {
      return {
        success: true,
        id: result.data.application_id,
      };
    }

    throw new Error('Unexpected response format from API');
  } catch (error) {
    console.error('Error sending application to external API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// send application to lms API

async function sendApplicationToLmsApi(
  payload: any,
): Promise<ExternalApiResponse> {
  try {
    const result = await sendToLms(payload);

    if ('error' in result && result.error) {
      // just retun the error
      return {
        success: false,
        error: result.message || result.error || 'Unknown error',
      };
    }

    // Check if it's a successful response
    if (
      'success' in result &&
      result.success &&
      'data' in result &&
      result.data
    ) {
      const idVal = result.data?.id;
      return {
        success: true,
        id: idVal != null ? String(idVal) : undefined,
      };
    }

    // Handle other successful responses without explicit success field
    if ('data' in result && result.data) {
      return {
        success: true,
        id: result.data.application_id,
      };
    }

    return {
      success: false,
      error: 'Unexpected response format from LMS API',
    };
  } catch (error) {
    console.error('Error sending application to LMS API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update application in external API
 */
async function updateApplicationInExternalApi(
  payload: any,
): Promise<ExternalApiResponse> {
  try {
    const result = await createOrUpdateApplication(payload);

    if ('error' in result && result.error) {
      throw new Error(result.message || result.error || 'Unknown error');
    }

    // Check if it's a successful response
    if (
      'success' in result &&
      result.success &&
      'data' in result &&
      result.data
    ) {
      return {
        success: true,
        id: result.data.application_id,
      };
    }

    // Handle other successful responses without explicit success field
    if ('data' in result && result.data) {
      return {
        success: true,
        id: result.data.application_id,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating application in external API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete application from external API
 * Note: Since the API doesn't have a DELETE endpoint, we'll update the status to "closed"
 */
async function deleteApplicationInExternalApi(
  payload: any,
): Promise<ExternalApiResponse> {
  try {
    const result = await createOrUpdateApplication(payload);

    if ('error' in result && result.error) {
      throw new Error(result.message || result.error || 'Unknown error');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting application from external API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Transform application data for external API
 */
async function transformApplicationForExternalApi(
  application: any,
): Promise<ApplicationPostRequest> {
  // Helper function to read file and convert to base64
  const readFileAsBase64 = async (filePath: string): Promise<string | null> => {
    try {
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      // Construct the full path - handle new /files/ format
      const fullPath = filePath.startsWith('/files/')
        ? path.resolve(
            process.cwd(),
            uploadDir,
            filePath.replace('/files/', ''),
          )
        : filePath;
      const fileBuffer = await fs.readFile(fullPath);
      return fileBuffer.toString('base64');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  };

  // Helper function to transform file fields
  const transformFile = async (file: any): Promise<FileUpload | undefined> => {
    if (!file) return undefined;

    // If it's a JSON string, try to parse it first
    if (typeof file === 'string') {
      try {
        const parsed = JSON.parse(file);
        // Recursively transform the parsed object
        return transformFile(parsed);
      } catch {
        // If JSON parsing fails, treat as a legacy string format (file path or ID)
        return file;
      }
    }

    // If it's already a number (legacy format), return as is
    if (typeof file === 'number') return file;

    // If it's an object with url/filename, read the file and convert to base64
    if (file.url && file.filename) {
      const base64Data = await readFileAsBase64(file.url);
      if (base64Data) {
        return {
          filename: file.filename,
          data: base64Data,
        };
      }
    }

    // If it already has filename and data, return as is
    if (file.filename && file.data) {
      return {
        filename: file.filename,
        data: file.data,
      };
    }

    return undefined;
  };

  // Helper function to transform multiple files
  const transformFiles = async (
    files: any,
  ): Promise<FileUpload[] | FileUpload | undefined> => {
    if (!files) return undefined;

    // If it's a JSON string, try to parse it first
    if (typeof files === 'string') {
      try {
        const parsed = JSON.parse(files);
        // Recursively transform the parsed data
        return transformFiles(parsed);
      } catch {
        // If JSON parsing fails, treat as a single file string
        return transformFile(files);
      }
    }

    // If it's an array, transform each file
    if (Array.isArray(files)) {
      const transformedFiles = await Promise.all(
        files.map((file) => transformFile(file)),
      );
      // Filter out undefined values
      const validFiles = transformedFiles.filter(
        (f) => f !== undefined,
      ) as FileUpload[];

      // Return the array if we have multiple files, or the first file if only one
      return validFiles.length > 1 ? validFiles : validFiles[0];
    }

    // If it's not an array, transform as a single file
    return transformFile(files);
  };

  // Helper function for fields that must be single files
  const transformSingleFile = async (
    files: any,
  ): Promise<FileUpload | undefined> => {
    const result = await transformFiles(files);
    // If it's an array, return only the first file
    if (Array.isArray(result)) {
      console.warn(
        'Multiple files provided where only one is expected. Using the first file.',
      );
      return result[0];
    }
    return result;
  };

  // Map status values using centralized constants
  const mapStatus = (status: string): ApplicationPostRequest['status'] => {
    // Try to convert using the centralized mapping
    try {
      return toApiStatus(status as ApplicationStatus);
    } catch {
      // Fallback for any unmapped status
      return 'draft';
    }
  };

  // Map gender values
  const mapGender = (gender: string): 'male' | 'female' | 'other' => {
    const genderMap: Record<string, 'male' | 'female' | 'other'> = {
      Male: 'male',
      Female: 'female',
      Other: 'other',
    };
    return (
      genderMap[gender] || (gender.toLowerCase() as 'male' | 'female' | 'other')
    );
  };

  // Map nature of business
  const mapNatureOfBusiness = (
    nature: string,
  ): 'startup' | 'expansion' | undefined => {
    if (!nature) return undefined;
    const natureMap: Record<string, 'startup' | 'expansion'> = {
      'Start-up': 'startup',
      Expansion: 'expansion',
    };
    return (
      natureMap[nature] || (nature.toLowerCase() as 'startup' | 'expansion')
    );
  };

  // Format date
  const formatDate = (date: any): string => {
    if (!date) return new Date().toISOString().split('T')[0]!;
    if (date instanceof Date) return date.toISOString().split('T')[0]!;
    if (typeof date === 'string') return date;
    return new Date().toISOString().split('T')[0]!;
  };

  // Extract value from array or single value
  const extractValue = (value: any): string | number | undefined => {
    if (!value) return undefined;

    // If it's a string, try to parse as JSON first
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // If parsed successfully, recursively extract value from parsed data
        return extractValue(parsed);
      } catch {
        // If JSON parsing fails, return the string as is
        return value;
      }
    }

    if (typeof value === 'number') return value;

    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        return (
          firstItem.name ||
          firstItem.label ||
          firstItem.value ||
          firstItem.id ||
          firstItem.tid
        );
      }
      return firstItem;
    }

    if (typeof value === 'object' && value !== null) {
      return value.name || value.label || value.value || value.id || value.tid;
    }

    return undefined;
  };

  const toUnixTimestamp = (dateValue: any): number | null => {
    if (!dateValue) return null;

    try {
      const date = new Date(dateValue);
      return Math.floor(date.getTime() / 1000); // Convert to Unix timestamp (seconds)
    } catch (error) {
      console.error('Error converting date to timestamp:', error);
      return null;
    }
  };

  // Clean null values
  const cleanValue = <T>(value: T | null | undefined): T | undefined => {
    return value === null ? undefined : value;
  };

  // Helper function to safely parse JSON strings and ensure arrays
  const parseToArray = (value: any): any[] | undefined => {
    if (!value) return undefined;

    // If it's already an array, return it
    if (Array.isArray(value)) return value;

    // If it's a string, try to parse it as JSON
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // If parsed result is an array, return it
        if (Array.isArray(parsed)) return parsed;
        // If parsed result is not an array, wrap it in one
        return [parsed];
      } catch {
        // If JSON parsing fails, wrap the string in an array
        return [value];
      }
    }

    // For any other type, wrap it in an array
    return [value];
  };

  // Transform files
  const groupRegistrationCertificate = await transformSingleFile(
    application.groupData?.groupRegistrationCertificate,
  );

  const listOfMembersOnCertificate = await transformSingleFile(
    application.groupData?.listOfMembersOnCertificate,
  );

  // tranform group minutes files
  const groupMinutesFilesResult = await transformFiles(
    application.groupData?.groupMeetingMinutes,
  );

  const groupCreditHistoryResult = await transformFiles(
    application.groupData?.groupCreditHistory,
  );

  const groupMinutesFiles = Array.isArray(groupMinutesFilesResult)
    ? groupMinutesFilesResult
    : groupMinutesFilesResult
      ? [groupMinutesFilesResult]
      : undefined;

  const groupCreditHistory = Array.isArray(groupCreditHistoryResult)
    ? groupCreditHistoryResult
    : groupCreditHistoryResult
      ? [groupCreditHistoryResult]
      : undefined;

  // Enhanced member transformation with better data preservation
  const transformedMembers = await Promise.all(
    (application.members || []).map(async (member: any) => {
      // Preserve ALL existing confirmation data exactly as in database
      const confirmationData = {
        requires_confirmation: member.requiresConfirmation !== false,
        confirmation_token: member.confirmation_token || undefined, // Convert null to undefined
        confirmation_sent_at:
          toUnixTimestamp(member.confirmation_sent_at) || undefined, // Convert null/0 to undefined
        confirmation_confirmed_at:
          toUnixTimestamp(member.confirmation_confirmed_at) || undefined, // Convert null/0 to undefined
        confirmation_status: member.confirmation_status,
        confirmation_token_expires_at:
          toUnixTimestamp(member.confirmation_token_expires_at) || undefined,
      };

      // Determine the correct status to send to API
      let apiConfirmationStatus = confirmationData.confirmation_status;

      if (
        confirmationData.confirmation_status === 'confirmed' ||
        confirmationData.confirmation_status === 'declined'
      ) {
        // Member has already responded - preserve their decision
        apiConfirmationStatus = confirmationData.confirmation_status;
      } else if (
        confirmationData.confirmation_token &&
        !confirmationData.confirmation_confirmed_at
      ) {
        // Token exists but no confirmation yet - status should be 'sent'
        apiConfirmationStatus = 'sent';
      } else if (
        !confirmationData.confirmation_token &&
        !confirmationData.confirmation_confirmed_at
      ) {
        // No token and no confirmation - status should be 'pending'
        apiConfirmationStatus = 'pending';
      }

      return {
        name: member.fullname || '',
        id_number: member.nationalIdCode || '',
        gender: mapGender(member.gender),
        phone_number: member.phoneNumber || '',
        position: extractValue(member.type),
        photo_member_id: await transformSingleFile(member.photoOfId),
        economic_activity: cleanValue(member.economicActivity),
        person_with_disability: !!member.certificateOfDisability,
        pwd_number: cleanValue(member.pwdNumber),
        certificate_disability: await transformSingleFile(
          member.certificateOfDisability,
        ),
        requires_confirmation: confirmationData.requires_confirmation,
        confirmation_token: confirmationData.confirmation_token, // undefined instead of null
        confirmation_sent_at: confirmationData.confirmation_sent_at, // undefined instead of null
        confirmation_confirmed_at: confirmationData.confirmation_confirmed_at, // undefined instead of null
        confirmation_status: apiConfirmationStatus,
      };
    }),
  );

  return {
    application_id: application.applicationId,
    identifier_type: application.user.identifierType,
    owner_identifier: application.user.email || application.user.name,
    phone_number: application.user.phoneNumber || '',
    status: mapStatus(application.status),

    // Group data
    group_name: application.groupData?.groupName || '',
    group_registration_number:
      application.groupData?.groupRegistrationNumber || '',
    date_registered: formatDate(application.groupData?.dateFormed),
    group_registration_certificate: groupRegistrationCertificate,
    list_of_members_certificate: listOfMembersOnCertificate,
    group_meeting_minutes: groupMinutesFiles
      ? Array.isArray(groupMinutesFiles)
        ? groupMinutesFiles
        : [groupMinutesFiles]
      : undefined,
    group_background: parseToArray(application.groupData?.purposeOfTheGroup),
    key_activities: parseToArray(
      application.groupData?.keyActivitiesOfTheGroup,
    ),
    value_chain: parseToArray(application.groupData?.valueChain),
    table_banking_duration:
      application.groupData?.tableBankingExperience !== null &&
      application.groupData?.tableBankingExperience !== undefined
        ? String(application.groupData.tableBankingExperience)
        : undefined,
    monthly_share_contribution: cleanValue(
      application.groupData?.tableBankingShareContribution,
    ),
    total_amount_loaned: cleanValue(
      application.groupData?.tableBankingTotalLoanedOut,
    ),
    total_revolving_fund: cleanValue(
      application.groupData?.tableBankingTotalRevolvingFund,
    ),
    other_activities: cleanValue(application.groupData?.other),
    group_credit_history: groupCreditHistory
      ? Array.isArray(groupCreditHistory)
        ? groupCreditHistory
        : [groupCreditHistory]
      : undefined,

    // Location
    county: extractValue(application.groupData?.countyOfOperation),
    constituency: extractValue(application.groupData?.constituency),
    ward: application.groupData?.ward || '',
    meeting_point: application.groupData?.meetingPoint || '',
    nearest_landmark: application.groupData?.nearestLandmark || '',
    nature_of_group: application.members?.[0]?.natureOfTheGroup,

    // Members
    group_members: transformedMembers,

    // Loan details
    loan_type: extractValue(application.loanConditions?.loanType),
    loan_amount: application.loanConditions?.loanAmount,
    proposed_repayment_period: application.loanConditions?.repaymentPeriod,
    bank_name: application.loanConditions?.bankName,
    institution_type: application.loanConditions?.institutionType,
    bank_branch: application.loanConditions?.bankBranch,
    bank_account_number: application.loanConditions?.accountNumber,

    // Business details
    nature_of_business: mapNatureOfBusiness(
      application.proposedBusiness?.natureOfBusiness,
    ),
    business_type: parseToArray(application.proposedBusiness?.businessType),
    years_in_operation: application.proposedBusiness?.yearsInBusiness,
    average_income: application.proposedBusiness?.averageIncome,
    expenses: application.proposedBusiness
      ? [
          {
            cost_of_goods: application.proposedBusiness.costOfGoods,
            rent: application.proposedBusiness.rentForBusiness,
            salaries: application.proposedBusiness.salaries,
            transport: application.proposedBusiness.transportForBusinessStock,
            // Add custom expenses as additional fields
            ...(application.proposedBusiness.customExpenses?.reduce(
              (acc: Record<string, number>, expense: any) => {
                // Convert expense name to a valid field name (snake_case, no spaces)
                const fieldName = expense.name
                  .toLowerCase()
                  .replace(/\s+/g, '_')
                  .replace(/[^a-z0-9_]/g, '');
                acc[fieldName] = expense.amount;
                return acc;
              },
              {},
            ) || {}),
          },
        ]
      : undefined,
  };
}

/**
 * Manually trigger sync for a specific application
 */
export async function syncApplication(
  applicationId: string,
  waitForCompletion = false,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const application = await prisma.application.findUnique({
      where: { applicationId },
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
      throw new Error('Application not found');
    }

    // Don't queue applications that already have externalId (already synced)
    if (application.externalId) {
      return {
        success: true,
        message: 'Application already synced to Drupal',
      };
    }

    // Don't queue applications that are still drafts (not ready for sync)
    if (
      application.status === ApplicationStatus.DRAFT ||
      application.status === ApplicationStatus.UNSUBMITTED
    ) {
      return {
        success: true,
        message: 'Application not ready for sync',
      };
    }

    // Check if there's already a pending sync for this application
    const existingQueueItem = await prisma.syncQueue.findFirst({
      where: {
        applicationId,
        status: {
          in: [QueueStatus.PENDING, QueueStatus.PROCESSING],
        },
      },
    });

    if (existingQueueItem) {
      // If it's processing, wait for it to complete
      if (existingQueueItem.status === QueueStatus.PROCESSING) {
        return {
          success: true,
          message: 'Application is currently being synced',
        };
      }

      // If it's pending and scheduled for later (due to retry), update it to run now
      if (existingQueueItem.scheduledFor > new Date()) {
        await prisma.syncQueue.update({
          where: { id: existingQueueItem.id },
          data: {
            scheduledFor: new Date(),
            // Reset attempts if user manually triggers sync
            attempts: 0,
          },
        });
      }
    } else {
      // Check if there's a recently failed item
      const failedQueueItem = await prisma.syncQueue.findFirst({
        where: {
          applicationId,
          status: QueueStatus.FAILED,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (failedQueueItem) {
        // If max attempts reached, create a new queue item with reset attempts
        await prisma.syncQueue.create({
          data: {
            applicationId,
            action: application.externalId
              ? SyncAction.UPDATE
              : SyncAction.CREATE,
            payload: JSON.stringify({}),
            status: QueueStatus.PENDING,
            attempts: 0, // Reset attempts for manual retry
            maxAttempts: 5, // Give more attempts for manual retries
          },
        });
      } else {
        // No existing queue item, create a new one
        await prisma.syncQueue.create({
          data: {
            applicationId,
            action: application.externalId
              ? SyncAction.UPDATE
              : SyncAction.CREATE,
            payload: JSON.stringify({}),
            status: QueueStatus.PENDING,
          },
        });
      }
    }

    // If waitForCompletion requested, process the specific item and wait
    if (waitForCompletion) {
      const queueItem = await prisma.syncQueue.findFirst({
        where: {
          applicationId,
          status: {
            in: [QueueStatus.PENDING, QueueStatus.PROCESSING],
          },
        },
      });

      if (queueItem) {
        await processSyncItem(queueItem.id);
        console.log('ready to process lms que');
        await processLmsQueue();
        console.log('finished processing lms que');
        // Check actual result
        const updatedApp = await prisma.application.findUnique({
          where: { applicationId },
          select: { syncStatus: true, syncError: true },
        });

        if (!updatedApp) {
          return { success: false, error: 'Application not found after sync' };
        }

        return {
          success: updatedApp.syncStatus === SyncStatus.COMPLETED,
          error: updatedApp.syncError || undefined,
        };
      }
    }

    // Default behavior: process queue in background
    console.log('calling processSyncQueue');
    await processSyncQueue();
    console.log('completed processing sync queue');

    // process lms queue as well
    console.log('calling processLmsQueue');
    await processLmsQueue();
    console.log('completed processing lms queue');

    return { success: true };
  } catch (error) {
    console.error('Error syncing application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add or update sync queue item for an application
 * This is a helper function to handle queue item creation/updates consistently
 */
export async function addToSyncQueue(
  applicationId: string,
  action: SyncAction = SyncAction.CREATE,
  options?: {
    priority?: boolean;
    maxAttempts?: number;
  },
) {
  try {
    // Check for existing active queue items
    const existingQueueItem = await prisma.syncQueue.findFirst({
      where: {
        applicationId,
        status: {
          in: [QueueStatus.PENDING, QueueStatus.PROCESSING],
        },
      },
    });

    if (existingQueueItem) {
      // If item exists and is pending, we might want to update its priority
      if (
        options?.priority &&
        existingQueueItem.status === QueueStatus.PENDING
      ) {
        await prisma.syncQueue.update({
          where: { id: existingQueueItem.id },
          data: {
            scheduledFor: new Date(), // Schedule immediately
            action, // Update action in case it changed
          },
        });
      }
      return existingQueueItem.id;
    }

    // Create new queue item
    const newQueueItem = await prisma.syncQueue.create({
      data: {
        applicationId,
        action,
        payload: JSON.stringify(options || {}),
        status: QueueStatus.PENDING,
        maxAttempts: options?.maxAttempts || 3,
        scheduledFor: options?.priority ? new Date() : new Date(),
      },
    });

    return newQueueItem.id;
  } catch (error) {
    console.error(
      `Error adding application ${applicationId} to sync queue:`,
      error,
    );
    throw error;
  }
}

/**
 * Get sync queue items with advanced filtering and pagination
 */
export async function getSyncQueueItems(
  filters?: QueueFilters,
  page = 1,
  pageSize = 20,
) {
  try {
    const where: any = {};

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters?.applicationId) {
      where.applicationId = {
        contains: filters.applicationId,
      };
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const totalCount = await prisma.syncQueue.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);

    const items = await prisma.syncQueue.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { scheduledFor: 'asc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get related application data
    const applicationIds = items.map((item) => item.applicationId);
    const applications = await prisma.application.findMany({
      where: {
        applicationId: { in: applicationIds },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        groupData: {
          select: {
            groupName: true,
          },
        },
      },
    });

    const applicationMap = new Map(
      applications.map((app) => [app.applicationId, app]),
    );

    const enrichedItems = items.map((item) => ({
      ...item,
      application: applicationMap.get(item.applicationId),
    }));

    return {
      items: enrichedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        pageSize,
      },
    };
  } catch (error) {
    console.error('Error fetching sync queue items:', error);
    throw error;
  }
}

/**
 * Get sync queue statistics
 */
export async function getSyncQueueStatistics(): Promise<QueueStatistics> {
  try {
    // Get counts by status
    const statusCounts = await prisma.syncQueue.groupBy({
      by: ['status'],
      _count: true,
    });

    const byStatus = statusCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      },
      {} as Record<QueueStatus, number>,
    );

    // Get counts by action
    const actionCounts = await prisma.syncQueue.groupBy({
      by: ['action'],
      _count: true,
    });

    const byAction = actionCounts.reduce(
      (acc, curr) => {
        acc[curr.action] = curr._count;
        return acc;
      },
      {} as Record<SyncAction, number>,
    );

    // Calculate average processing time for completed items
    const completedItems = await prisma.syncQueue.findMany({
      where: {
        status: QueueStatus.COMPLETED,
        processedAt: { not: null },
      },
      select: {
        createdAt: true,
        processedAt: true,
      },
    });

    let averageProcessingTime = 0;
    if (completedItems.length > 0) {
      const totalTime = completedItems.reduce((sum, item) => {
        if (item.processedAt) {
          return sum + (item.processedAt.getTime() - item.createdAt.getTime());
        }
        return sum;
      }, 0);
      averageProcessingTime = totalTime / completedItems.length / 1000; // in seconds
    }

    // Calculate success rate
    const total = await prisma.syncQueue.count();
    const completed = byStatus[QueueStatus.COMPLETED] || 0;
    const failed = byStatus[QueueStatus.FAILED] || 0;
    const processed = completed + failed;
    const successRate = processed > 0 ? (completed / processed) * 100 : 0;

    // Get oldest pending item
    const oldestPending = await prisma.syncQueue.findFirst({
      where: { status: QueueStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    return {
      total,
      byStatus,
      byAction,
      averageProcessingTime,
      successRate,
      oldestPending: oldestPending?.createdAt,
    };
  } catch (error) {
    console.error('Error getting sync queue statistics:', error);
    throw error;
  }
}

/**
 * Manually process a specific queue item
 */
export async function processQueueItem(queueItemId: string) {
  try {
    const queueItem = await prisma.syncQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    if (queueItem.status === QueueStatus.PROCESSING) {
      throw new Error('Item is already being processed');
    }

    if (queueItem.status === QueueStatus.COMPLETED) {
      throw new Error('Item has already been completed');
    }

    // Process the item
    await processSyncItem(queueItemId);

    return { success: true };
  } catch (error) {
    console.error(
      `Error manually processing queue item ${queueItemId}:`,
      error,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Release a stuck queue item (reset from PROCESSING to PENDING)
 */
export async function releaseQueueItem(queueItemId: string) {
  try {
    const queueItem = await prisma.syncQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    if (queueItem.status !== QueueStatus.PROCESSING) {
      throw new Error('Item is not in processing state');
    }

    // Check if it's been processing for too long (e.g., > 5 minutes)
    const processingTime = Date.now() - queueItem.updatedAt.getTime();
    const maxProcessingTime = 5 * 60 * 1000; // 5 minutes

    if (processingTime < maxProcessingTime) {
      throw new Error(
        `Item has only been processing for ${Math.round(processingTime / 1000)} seconds. ` +
          `Wait at least ${Math.round(maxProcessingTime / 1000)} seconds before releasing.`,
      );
    }

    await prisma.syncQueue.update({
      where: { id: queueItemId },
      data: {
        status: QueueStatus.PENDING,
        scheduledFor: new Date(),
        error: 'Released from stuck processing state',
      },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error releasing queue item ${queueItemId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Retry a failed queue item
 */
export async function retryQueueItem(queueItemId: string) {
  try {
    const queueItem = await prisma.syncQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    if (queueItem.status !== QueueStatus.FAILED) {
      throw new Error('Only failed items can be retried');
    }

    await prisma.syncQueue.update({
      where: { id: queueItemId },
      data: {
        status: QueueStatus.PENDING,
        attempts: 0, // Reset attempts
        scheduledFor: new Date(),
        error: null,
      },
    });

    // Update application sync status
    await prisma.application.update({
      where: { applicationId: queueItem.applicationId },
      data: {
        syncStatus: SyncStatus.PENDING,
        syncAttempts: 0,
        syncError: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error retrying queue item ${queueItemId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel a queue item
 */
export async function cancelQueueItem(queueItemId: string) {
  try {
    const queueItem = await prisma.syncQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    if (queueItem.status === QueueStatus.COMPLETED) {
      throw new Error('Cannot cancel completed items');
    }

    if (queueItem.status === QueueStatus.PROCESSING) {
      throw new Error('Cannot cancel items that are currently processing');
    }

    await prisma.syncQueue.update({
      where: { id: queueItemId },
      data: {
        status: QueueStatus.FAILED,
        error: 'Cancelled by admin',
        processedAt: new Date(),
      },
    });

    // Update application sync status
    await prisma.application.update({
      where: { applicationId: queueItem.applicationId },
      data: {
        syncStatus: SyncStatus.FAILED,
        syncError: 'Sync cancelled by admin',
      },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error cancelling queue item ${queueItemId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Bulk retry all failed items
 */
export async function retryAllFailedItems() {
  try {
    const result = await prisma.syncQueue.updateMany({
      where: {
        status: QueueStatus.FAILED,
      },
      data: {
        status: QueueStatus.PENDING,
        attempts: 0,
        scheduledFor: new Date(),
        error: null,
      },
    });

    // Update related applications
    const failedApplications = await prisma.syncQueue.findMany({
      where: {
        status: QueueStatus.FAILED,
      },
      select: {
        applicationId: true,
      },
    });

    if (failedApplications.length > 0) {
      await prisma.application.updateMany({
        where: {
          applicationId: {
            in: failedApplications.map((item) => item.applicationId),
          },
        },
        data: {
          syncStatus: SyncStatus.PENDING,
          syncAttempts: 0,
          syncError: null,
        },
      });
    }

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    console.error('Error retrying all failed items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process pending LMS sync queue items
 */
export async function processLmsQueue() {
  console.log('Processing LMS queue');
  try {
    // Get pending LMS items scheduled for now or earlier
    const pendingLmsItems = await prisma.lmsSyncQueue.findMany({
      where: {
        status: LmsSyncStatus.PENDING,
        nextRetryAt: {
          lte: new Date(),
        },
        attempts: {
          lt: prisma.lmsSyncQueue.fields.maxAttempts, // Check max attempts
        },
      },
      orderBy: {
        nextRetryAt: 'asc',
      },
      take: 10,
    });

    console.log('lms pending items', pendingLmsItems.length);

    for (const item of pendingLmsItems) {
      await processLmsQueueItem(item.id);
    }

    return { processed: pendingLmsItems.length };
  } catch (error) {
    console.error('Error processing LMS queue:', error);
  }
}

const isDefinitelyPermanentError = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;

  const msg = err.message.toLowerCase();

  if (
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('invalid') ||
    msg.includes('validation failed') ||
    msg.includes('not found') ||
    msg.includes('already exists') ||
    msg.includes('duplicate') ||
    msg.includes('422') ||
    msg.includes('403') ||
    msg.includes('401') ||
    msg.includes('invalid_api_key') ||
    msg.includes('invalid_api_key_requested') ||
    msg.includes('IP address not authorized') ||
    msg.includes('ip_not_allowed') ||
    msg.includes('missing_api_key') ||
    msg.includes('rate_limited')
  ) {
    return true;
  }

  if (
    msg.includes('econnrefused') ||
    msg.includes('connection refused') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') || // DNS failure
    msg.includes('certificate') || // SSL issues
    msg.includes('self signed') ||
    msg.includes('depth') // certificate chain
  ) {
    return false;
  }

  return false;
};

/**
 * Process a single LMS sync queue item
 */
async function processLmsQueueItem(lmsQueueItemId: string) {
  try {
    console.log(`Processing LMS queue item ${lmsQueueItemId}`);
    // Mark as processing
    await prisma.lmsSyncQueue.update({
      where: { id: lmsQueueItemId },
      data: { status: LmsSyncStatus.PROCESSING },
    });

    const lmsQueueItem = await prisma.lmsSyncQueue.findUnique({
      where: { id: lmsQueueItemId },
    });

    if (!lmsQueueItem) {
      console.log('LMS queue item not found during processing');
      await prisma.lmsSyncQueue.update({
        where: { id: lmsQueueItemId },
        data: {
          status: LmsSyncStatus.FAILED,
          error: 'LMS queue item not found',
        },
      });
      throw new Error('LMS queue item not found');
    }

    // Get the application to update status
    const application = await prisma.application.findUnique({
      where: { applicationId: lmsQueueItem.applicationId },
    });

    if (!application) {
      await prisma.lmsSyncQueue.update({
        where: { id: lmsQueueItemId },
        data: { status: LmsSyncStatus.FAILED, error: 'Application not found' },
      });
      throw new Error('Application not found');
    }

    // Send to LMS API
    const result = await sendApplicationToLmsApi(lmsQueueItem.payload);

    if (result.success) {
      console.log(`LMS sync successful for queue item ${result}`);
      // Mark LMS queue as completed
      await prisma.lmsSyncQueue.update({
        where: { id: lmsQueueItemId },
        data: {
          status: LmsSyncStatus.COMPLETED,
          successData: result as any,
          attempts: lmsQueueItem.attempts + 1,
          lastAttemptAt: new Date(),
          error: null,
        },
      });

      // Update application LMS status
      await prisma.application.update({
        where: { id: application.id },
        data: {
          lmsSyncStatus: LmsSyncStatus.COMPLETED,
          lmsReferenceId: result.id,
          lmsLastSyncAt: new Date(),
          lmsSyncError: null,
          lmsSyncAttempts: (application.lmsSyncAttempts || 0) + 1,
        },
      });
    } else {
      // update status to pending to trigger retry logic and attempts increment
      await prisma.lmsSyncQueue.update({
        where: { id: lmsQueueItemId },
        data: {
          status: LmsSyncStatus.PENDING,
          attempts: lmsQueueItem.attempts + 1,
          lastAttemptAt: new Date(),
          error: result.error || 'LMS sync failed',
        },
      });
      throw new Error(result.error || 'LMS sync failed');
    }
  } catch (error) {
    const lmsQueueItem = await prisma.lmsSyncQueue.findUnique({
      where: { id: lmsQueueItemId },
    });

    if (!lmsQueueItem) return;

    console.error(`LMS sync attempt failed`, {
      queueId: lmsQueueItemId,
      applicationId: lmsQueueItem.applicationId,
      error: error instanceof Error ? error.message : String(error),
    });

    const attempts = lmsQueueItem.attempts + 1;
    const maxAttempts = lmsQueueItem.maxAttempts ?? 8;

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    let nextStatus: LmsSyncStatus;
    let shouldDrop = false;

    if (isDefinitelyPermanentError(error)) {
      nextStatus = LmsSyncStatus.FAILED;
      shouldDrop = true;
    } else if (attempts >= maxAttempts) {
      nextStatus = LmsSyncStatus.FAILED;
      shouldDrop = true;
    } else {
      nextStatus = LmsSyncStatus.PENDING;
      shouldDrop = false;
    }

    const retryDelayMs = shouldDrop
      ? 0
      : Math.min(5 * 60_000 * Math.pow(1.8, attempts - 1), 4 * 3600_000); // ~4h max

    await prisma.lmsSyncQueue.update({
      where: { id: lmsQueueItemId },
      data: {
        status: nextStatus,
        attempts,
        lastAttemptAt: new Date(),
        nextRetryAt: shouldDrop ? null : new Date(Date.now() + retryDelayMs),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    await prisma.application.update({
      where: { applicationId: lmsQueueItem.applicationId },
      data: {
        lmsSyncStatus: nextStatus,
        lmsSyncError: error instanceof Error ? error.message : 'Unknown error',
        lmsSyncAttempts: attempts,
        lmsLastSyncAt: new Date(),
      },
    });

    if (shouldDrop) {
      console.warn(`Giving up on LMS sync after ${attempts} attempts`, {
        permanent: isDefinitelyPermanentError(error),
        applicationId: lmsQueueItem.applicationId,
      });
    }
  }
}

function shouldNotRetry(errorMessage: string): boolean {
  const lowerMsg = errorMessage.toLowerCase();
  const permanentPatterns = [
    'not found',
    'invalid',
    'unauthorized',
    'forbidden',
    'validation failed',
    'duplicate entry',
    '422', // Unprocessable entity
    '403', // Forbidden
    '401', // Unauthorized
  ];
  return permanentPatterns.some((pattern) => lowerMsg.includes(pattern));
}
