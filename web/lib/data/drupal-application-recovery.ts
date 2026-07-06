'use server';

import { Gender, type Prisma } from '@/generated/prisma';
import type { ApplicationDetail } from '@/lib/api/schema/application/applications-list.schema';
import { prisma } from '@/lib/db/prisma';
import { promises as fs } from 'fs';
import path from 'path';

type DrupalFile = {
  filename?: string;
  url?: string;
  filesize?: number | string;
  size?: number | string;
};

async function fetchDrupalApplicationDetail(
  applicationId: string,
): Promise<ApplicationDetail | null> {
  const apiUrl = process.env.API_URL;
  const apiKey = process.env.EXTERNAL_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('API_URL or EXTERNAL_API_KEY is not configured');
  }

  const response = await fetch(
    `${apiUrl.replace(/\/$/, '')}/api/v1/application/${encodeURIComponent(applicationId)}`,
    {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(30000),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`Drupal application fetch failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload?.data ?? null;
}

function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value ?? []);
}

function extractTermName(
  value: { name?: string } | string | null | undefined,
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name ?? '';
}

async function resolvePortalFileRef(
  applicationId: string,
  file: DrupalFile | null | undefined,
): Promise<string | null> {
  if (!file?.filename && !file?.url) {
    return null;
  }

  const expectedSize = Number(file.filesize ?? file.size ?? 0);
  const uploadsDir = path.join(process.cwd(), 'uploads', applicationId);

  if (file.url?.startsWith('/files/')) {
    const relativePath = file.url.replace('/files/', '');
    const directPath = path.join(process.cwd(), 'uploads', relativePath);
    try {
      await fs.access(directPath);
      return safeJsonStringify({
        url: file.url,
        filename: file.filename ?? path.basename(relativePath),
      });
    } catch {
      // Fall through to size-based lookup below.
    }
  }

  try {
    const entries = await fs.readdir(uploadsDir);
    for (const entry of entries) {
      const entryPath = path.join(uploadsDir, entry);
      const stat = await fs.stat(entryPath);
      if (!stat.isFile()) continue;

      if (!expectedSize || stat.size === expectedSize) {
        return safeJsonStringify({
          url: `/files/${applicationId}/${entry}`,
          filename: file.filename ?? entry,
        });
      }
    }
  } catch {
    return file.url
      ? safeJsonStringify({
          url: file.url,
          filename: file.filename ?? path.basename(file.url),
        })
      : null;
  }

  return file.url
    ? safeJsonStringify({
        url: file.url,
        filename: file.filename ?? path.basename(file.url),
      })
    : null;
}

function mapGender(gender?: string): Gender {
  if (gender?.toLowerCase() === 'male') return Gender.Male;
  return Gender.Female;
}

export async function recoverApplicationDataFromDrupal(
  applicationId: string,
): Promise<{ recovered: boolean; error?: string }> {
  const application = await prisma.application.findUnique({
    where: { applicationId },
    include: {
      groupData: true,
      members: true,
      loanConditions: true,
      proposedBusiness: { include: { customExpenses: true } },
    },
  });

  if (!application) {
    return {
      recovered: false,
      error: 'Application not found in portal database',
    };
  }

  const hasPortalData =
    application.groupData != null &&
    application.loanConditions != null &&
    application.proposedBusiness != null &&
    application.members.length > 0;

  if (hasPortalData) {
    return { recovered: false };
  }

  const drupalApp = await fetchDrupalApplicationDetail(applicationId);
  if (
    !drupalApp?.group_data ||
    !drupalApp.loan_conditions ||
    !drupalApp.proposed_business
  ) {
    return {
      recovered: false,
      error: 'Drupal does not have complete application data to recover',
    };
  }

  const groupRegistrationCertificate = await resolvePortalFileRef(
    applicationId,
    drupalApp.group_data.group_registration_certificate,
  );
  const listOfMembersOnCertificate = await resolvePortalFileRef(
    applicationId,
    drupalApp.group_data.list_of_members_certificate,
  );

  if (!groupRegistrationCertificate || !listOfMembersOnCertificate) {
    return {
      recovered: false,
      error: 'Could not resolve uploaded files for recovered application data',
    };
  }

  const groupDataPayload: Prisma.GroupDataCreateInput = {
    application: { connect: { id: application.id } },
    groupName: drupalApp.group_data.group_name ?? '',
    groupRegistrationNumber:
      drupalApp.group_data.group_registration_number ?? '',
    dateFormed: new Date(drupalApp.group_data.date_registered ?? Date.now()),
    groupRegistrationCertificate,
    listOfMembersOnCertificate,
    groupMeetingMinutes: safeJsonStringify(
      drupalApp.group_data.group_meeting_minutes ?? [],
    ),
    purposeOfTheGroup: safeJsonStringify(
      drupalApp.group_data.group_background ?? [],
    ),
    keyActivitiesOfTheGroup: safeJsonStringify(
      drupalApp.group_data.key_activities ?? [],
    ),
    groupCreditHistory: safeJsonStringify(
      drupalApp.group_data.group_credit_history ?? [],
    ),
    other: drupalApp.group_data.other_activities ?? null,
    valueChain: drupalApp.group_data.value_chain?.length
      ? safeJsonStringify(drupalApp.group_data.value_chain)
      : null,
    tableBankingExperience: drupalApp.group_data.table_banking_duration
      ? Number(drupalApp.group_data.table_banking_duration)
      : null,
    tableBankingShareContribution: drupalApp.group_data
      .monthly_share_contribution
      ? Number(drupalApp.group_data.monthly_share_contribution)
      : null,
    tableBankingTotalLoanedOut: drupalApp.group_data.total_amount_loaned
      ? Number(drupalApp.group_data.total_amount_loaned)
      : null,
    tableBankingTotalRevolvingFund: drupalApp.group_data.total_revolving_fund
      ? Number(drupalApp.group_data.total_revolving_fund)
      : null,
    countyOfOperation: extractTermName(drupalApp.location?.county),
    constituency: extractTermName(drupalApp.location?.constituency),
    ward: drupalApp.location?.ward ?? '',
    meetingPoint: drupalApp.location?.meeting_point ?? '',
    nearestLandmark: drupalApp.location?.nearest_landmark ?? '',
  };

  const loan = drupalApp.loan_conditions;
  const business = drupalApp.proposed_business;
  const natureOfGroup = drupalApp.nature_of_group ?? 'women';

  await prisma.$transaction(async (tx) => {
    if (application.groupData) {
      const { application: _application, ...groupDataUpdate } =
        groupDataPayload;
      await tx.groupData.update({
        where: { id: application.groupData.id },
        data: groupDataUpdate,
      });
    } else {
      await tx.groupData.create({ data: groupDataPayload });
    }

    const loanPayload = {
      loanType: extractTermName(loan.loan_type),
      loanAmount: Number(loan.loan_amount ?? 0),
      repaymentPeriod: Number(loan.proposed_repayment_period ?? 0),
      bankName: extractTermName(loan.bank_name),
      institutionType: extractTermName(loan.institution_type) || null,
      bankBranch: loan.bank_branch ?? '',
      accountNumber: loan.bank_account_number ?? '',
    };

    if (application.loanConditions) {
      await tx.loanConditions.update({
        where: { id: application.loanConditions.id },
        data: loanPayload,
      });
    } else {
      await tx.loanConditions.create({
        data: {
          ...loanPayload,
          applicationId: application.id,
        },
      });
    }

    const businessPayload = {
      natureOfBusiness: business.nature_of_business ?? 'expansion',
      businessType: safeJsonStringify(business.business_type ?? []),
      yearsInBusiness: Math.round(Number(business.years_in_operation ?? 0)),
      averageIncome: Number(business.average_income ?? 0),
      costOfGoods: 0,
      rentForBusiness: 0,
      salaries: 0,
      transportForBusinessStock: 0,
    };

    if (application.proposedBusiness) {
      await tx.proposedBusiness.update({
        where: { id: application.proposedBusiness.id },
        data: businessPayload,
      });
    } else {
      await tx.proposedBusiness.create({
        data: {
          ...businessPayload,
          applicationId: application.id,
        },
      });
    }

    if (application.members.length === 0 && drupalApp.group_members?.length) {
      for (const member of drupalApp.group_members) {
        const photoOfId = await resolvePortalFileRef(
          applicationId,
          member.photo_member_id,
        );
        if (!photoOfId) {
          throw new Error(
            `Could not resolve member ID photo for ${member.name ?? 'unknown member'}`,
          );
        }

        const certificateOfDisability = member.certificate_disability
          ? await resolvePortalFileRef(
              applicationId,
              member.certificate_disability,
            )
          : null;

        await tx.memberData.create({
          data: {
            applicationId: application.id,
            natureOfTheGroup: natureOfGroup,
            fullname: member.name ?? '',
            nationalIdCode: member.id_number ?? '',
            gender: mapGender(member.gender),
            type: extractTermName(member.position),
            economicActivity: member.economic_activity ?? null,
            phoneNumber: member.phone_number ?? '',
            photoOfId,
            certificateOfDisability,
            pwdNumber: member.pwd_number ?? null,
            requiresConfirmation: member.requires_confirmation ?? false,
          },
        });
      }
    }
  });

  console.log(
    `[Recovery] Restored portal application data for ${applicationId} from Drupal`,
  );

  return { recovered: true };
}
