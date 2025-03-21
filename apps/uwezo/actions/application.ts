"use server";

import { auth } from "@/lib/auth";
import { dummyApplications } from "@/lib/dummy-data";
import { createApplicationId } from "@/lib/util";

declare global {
  var dummyApplicationsTest: ApplicationData[];
}

globalThis.dummyApplicationsTest = globalThis.dummyApplicationsTest || [
  ...dummyApplications,
];

const dummyApplicationsTest = globalThis.dummyApplicationsTest;

export type Status = "PENDING" | "IN_REVIEW" | "UNSUBMITTED";

export type MemberType = "Chairman" | "Secretary" | "Member";

export type GenderType = "Male" | "Female" | "Other";

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
}

export interface GroupData {
  basics: {
    groupName: string;
    groupRegistrationNumber: string;
    dateFormed: Date;
    groupRegistrationCertificate: string;
    listOfMembersOnCertificate: string;
  };
  background: {
    purposeOfTheGroup: string[];
    keyActivitiesOfTheGroup: string[];
    groupCreditHistory: string;
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
  photoOfId?: string;
  disability?: {
    certificateOfDisability: string;
    pwdNumber?: string;
  };
  status?: "confirmed" | "pending";
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
}

export interface ConfirmationsData {
  declarations: DeclarationsData;
}

export interface DeclarationsData {
  membersConfirm: "on" | null;
  correctInformationConfirm: "on" | null;
  liabilityConfirm: "on" | null;
  fundsEligibleConfirm: "on" | null;
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
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("User not found");
  }

  const generalDetails: GeneralDetails = {
    applicationId: createApplicationId(),
    status: "UNSUBMITTED",
    user: session.user.email,
  };
  dummyApplicationsTest.push({ generalDetails });

  return Promise.resolve(generalDetails);
}

async function getApplication(id: string) {
  const session = await auth();
  const applicationIndex = dummyApplicationsTest.findIndex(
    (app) =>
      app.generalDetails.applicationId === id &&
      app.generalDetails.user === session?.user?.email,
  );

  const application = dummyApplicationsTest[applicationIndex];

  /* this should not happen */
  if (applicationIndex === -1 || !application) {
    throw new Error("Application not found");
  }

  return { application, applicationIndex };
}

export async function updateApplicationGroupData(id: string, data: GroupData) {
  const { application, applicationIndex } = await getApplication(id);

  const newApplicationData: ApplicationData = {
    ...application,
    groupData: data,
  };

  // update application data
  dummyApplicationsTest[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData);
}

export async function updateApplicationMembersData(
  id: string,
  data: MembersData,
) {
  const { application, applicationIndex } = await getApplication(id);

  const newApplicationData: ApplicationData = {
    ...application,
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

  const newApplicationData: ApplicationData = {
    ...application,
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

  const newApplicationData: ApplicationData = {
    ...application,
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

  const newApplicationData: ApplicationData = {
    ...application,
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
      member.status = "confirmed";
    } else {
      member.status = "pending";
    }

    return member;
  });

  const newApplicationData: ApplicationData = {
    ...application,
    members: {
      natureOfTheGroup: application.members?.natureOfTheGroup || "",
      members: updatedMembers,
    },
  };

  // update application data
  dummyApplicationsTest[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData.members?.members);
}
