'use server';

import { ApplicationStatus } from '@/generated/prisma';
// import { auth } from "@/lib/auth";
import { dummyApplications } from '@/lib/data/dummy-data';
import { createApplicationId } from '@/lib/util';
import { isFileUpload } from '@workspace/ui/lib/utils';
import type { ValidFile } from '@workspace/ui/lib/zod';

declare global {
  /* eslint no-var: off */
  var dummyApplicationsTest: ApplicationData[];
}

globalThis.dummyApplicationsTest = globalThis.dummyApplicationsTest || [
  ...dummyApplications,
];

const dummyApplicationsTest = globalThis.dummyApplicationsTest;

export type Status = ApplicationStatus;

export type MemberType = 'Chairman' | 'Secretary' | 'Member';

export type GenderType = 'Male' | 'Female' | 'Other';

export interface ApplicationData {
  generalDetails: GeneralDetails;
  groupData?: GroupData;
  members?: MembersData;
  loanConditions?: LoanConditionsData;
  proposedBusiness?: ProposedBusinessData;
  confirmations?: ConfirmationsData;
}

export interface GeneralDetails {
  applicationId: string;
  status: Status;
  user: string; // currently user email
  applicationProgress?: number;
  rejectionDetails?: {
    rejectionReason?:
      | 'incomplete_information'
      | 'missing_documents'
      | 'eligibility_criteria'
      | 'duplicate_application'
      | 'insufficient_collateral'
      | 'poor_credit_history'
      | 'member_declined'
      | 'other';
    rejectionMessage?: string;
  };
}

export interface GroupData {
  basics: {
    groupName: string;
    groupRegistrationNumber: string;
    dateFormed: string;
    groupRegistrationCertificate: ValidFile;
    listOfMembersOnCertificate: ValidFile;
  };
  background: {
    purposeOfTheGroup: string[];
    keyActivitiesOfTheGroup: string[];
    groupCreditHistory: ValidFile[];
    other?: string | null;
    valueChain?: string[] | null;
    tableBanking?: {
      tableBankingExperience?: number;
      tableBankingShareContribution?: number;
      tableBankingTotalLoanedOut?: number;
      tableBankingTotalRevolvingFund?: number;
    };
  };
  location: {
    countyOfOperation: string;
    constituency: string;
    ward: string;
    meetingPoint: string;
    nearestLandmark: string;
  };
}

// TODO: When member data is validated fix this, Only disability is optional
export interface Member {
  fullname?: string;
  nationalIdCode?: string;
  gender?: GenderType;
  type?: MemberType;
  phoneNumber?: string;
  photoOfId: ValidFile;
  disability?: {
    certificateOfDisability: ValidFile;
    pwdNumber?: string;
  };
  status?: 'confirmed' | 'pending';
  requiresConfirmation?: boolean;
}

export interface MembersData {
  natureOfTheGroup: string;
  members: Member[];
}

export interface LoanConditionsData {
  purposeOfLoan: string[];
  loanType: string;
  loanAmount: number;
  repaymentPeriod: number;
  bankName: string;
  bankNameOther?: string;
  bankBranch: string;
  accountNumber: string;
}

export interface ProposedBusinessData {
  natureOfBusiness: string;
  businessType: string[];
  yearsInBusiness: number;
  averageIncome: number;
  costOfGoods: number;
  rentForBusiness: number;
  salaries: number;
  transportForBusinessStock: number;
  customExpenses?: Array<{
    name: string;
    amount: number;
  }>;
}

export interface ConfirmationsData {
  declarations: DeclarationsData;
}

export interface DeclarationsData {
  membersConfirm: 'on' | null;
  correctInformationConfirm: 'on' | null;
  liabilityConfirm: 'on' | null;
  fundsEligibleConfirm: 'on' | null;
}

export async function getApplications() {
  return Promise.resolve(dummyApplicationsTest);
}

export async function getApplicationById(id: string) {
  return Promise.resolve(
    dummyApplicationsTest.find(
      (app) => app.generalDetails.applicationId === id,
    ),
  );
}

export async function createApplication() {
  // const session = await auth();

  // if (!session?.user?.email) {
  //   throw new Error("User not found");
  // }

  const generalDetails: GeneralDetails = {
    applicationId: createApplicationId(),
    status: ApplicationStatus.UNSUBMITTED,
    user: 'test@test.com',
    applicationProgress: 1,
  };
  dummyApplicationsTest.push({ generalDetails });

  return Promise.resolve(generalDetails);
}

async function getApplication(id: string) {
  const applicationIndex = dummyApplicationsTest.findIndex(
    (app) => app.generalDetails.applicationId === id,
  );

  const application = dummyApplicationsTest[applicationIndex];

  /* this should not happen */
  if (applicationIndex === -1 || !application) {
    throw new Error('Application not found');
  }

  return { application, applicationIndex };
}

export async function updateApplicationGroupData(id: string, data: GroupData) {
  const { application, applicationIndex } = await getApplication(id);

  const currentProgress = application.generalDetails.applicationProgress;

  const newApplicationData = {
    ...application,
    generalDetails: {
      ...application.generalDetails,
      applicationProgress:
        currentProgress && currentProgress > 2 ? currentProgress : 2,
    },
    groupData: {
      ...application.groupData,
      background: {
        ...application.groupData?.background,
        ...data.background,
      },
      location: {
        ...application.groupData?.location,
        ...data.location,
      },
      basics: {
        ...application.groupData?.basics,
        ...data.basics,
      },
    },
  } satisfies ApplicationData;

  // save files - check if values are file-like objects
  if (Array.isArray(data.background.groupCreditHistory)) {
    newApplicationData.groupData.background.groupCreditHistory =
      data.background.groupCreditHistory.map((file) =>
        isFileUpload(file) ? saveFile(file as File) : file,
      );
  }

  if (isFileUpload(data.basics.groupRegistrationCertificate)) {
    newApplicationData.groupData.basics.groupRegistrationCertificate = saveFile(
      data.basics.groupRegistrationCertificate as File,
    );
  }

  if (isFileUpload(data.basics.listOfMembersOnCertificate)) {
    newApplicationData.groupData.basics.listOfMembersOnCertificate = saveFile(
      data.basics.listOfMembersOnCertificate as File,
    );
  }

  // update application data
  dummyApplicationsTest[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData);
}

export async function updateApplicationMembersData(
  id: string,
  data: MembersData,
) {
  const { application, applicationIndex } = await getApplication(id);

  const currentProgress = application.generalDetails.applicationProgress;

  const newApplicationData: ApplicationData = {
    ...application,
    generalDetails: {
      ...application.generalDetails,
      applicationProgress:
        currentProgress && currentProgress > 3 ? currentProgress : 3,
    },
    members: data,
  };

  // update application data
  dummyApplicationsTest[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData);
}

export async function updateApplicationLoanConditionsData(
  id: string,
  data: LoanConditionsData,
) {
  const { application, applicationIndex } = await getApplication(id);

  const currentProgress = application.generalDetails.applicationProgress;

  const newApplicationData: ApplicationData = {
    ...application,
    generalDetails: {
      ...application.generalDetails,
      applicationProgress:
        currentProgress && currentProgress > 4 ? currentProgress : 4,
    },
    loanConditions: data,
  };

  // update application data
  dummyApplicationsTest[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData);
}

export async function updateApplicationProposedBusinessData(
  id: string,
  data: ProposedBusinessData,
) {
  const { application, applicationIndex } = await getApplication(id);

  const currentProgress = application.generalDetails.applicationProgress;

  const newApplicationData: ApplicationData = {
    ...application,
    generalDetails: {
      ...application.generalDetails,
      applicationProgress:
        currentProgress && currentProgress > 5 ? currentProgress : 5,
    },
    proposedBusiness: data,
  };

  // update application data
  dummyApplicationsTest[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData);
}

export async function updateApplicationDeclarationsData(
  id: string,
  data: DeclarationsData,
) {
  const { application, applicationIndex } = await getApplication(id);

  const currentProgress = application.generalDetails.applicationProgress;

  const newApplicationData: ApplicationData = {
    ...application,
    generalDetails: {
      ...application.generalDetails,
      applicationProgress:
        currentProgress && currentProgress > 6 ? currentProgress : 6,
    },
    confirmations: {
      declarations: data,
    },
  };

  // update application data
  dummyApplicationsTest[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData);
}

export async function updateApplicationMembersConfirmationData(id: string) {
  const { application, applicationIndex } = await getApplication(id);

  const members = application.members?.members || [];

  const passThreshold = Math.ceil(members.length * 0.7);

  const updatedMembers = members.map((member, index) => {
    if (index + 1 <= passThreshold) {
      member.status = 'confirmed';
    } else {
      member.status = 'pending';
    }

    return member;
  });

  const newApplicationData: ApplicationData = {
    ...application,
    members: {
      natureOfTheGroup: application.members?.natureOfTheGroup || '',
      members: updatedMembers,
    },
  };

  // update application data
  dummyApplicationsTest[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData.members?.members);
}

export async function updateApplicationStatus(id: string) {
  const { application, applicationIndex } = await getApplication(id);

  const newApplicationData: ApplicationData = {
    ...application,
    generalDetails: {
      ...application.generalDetails,
      status: ApplicationStatus.SUBMITTED,
      applicationProgress: 7,
    },
  };

  // update application data
  dummyApplicationsTest[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData.generalDetails);
}

function saveFile(file: File) {
  console.log('save file', file);
  // TODO: if we want to store real files, we need to upload them to a server

  // Check if it's a file-like object
  if (isFileUpload(file)) {
    const fileObject: ValidFile = {
      fid: Date.now() + Math.random(),
      filename: file.name,
      url: typeof URL !== 'undefined' ? URL.createObjectURL(file) : '',
    };
    return fileObject;
  }

  // Fallback for server environment
  const fileObject: ValidFile = {
    fid: Date.now() + Math.random(),
    filename: 'unknown-file',
    url: '/images/sample-file.jpg',
  };

  return fileObject;
}
