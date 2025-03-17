"use server";

import { auth } from "@/lib/auth";
import { dummyApplications } from "@/lib/dummy-data";
import { createApplicationId } from "@/lib/util";

declare global {
  var dummyApplicationsTest: ApplicationData[];
}

export type Status = "PENDING" | "IN_REVIEW" | "UNSUBMITTED";

export type MemberType = "Chairman" | "Secretary" | "Member";

export type GenderType = "Male" | "Female" | "Other";

export interface LoanDetails {
  purpose: string;
  type: string;
  amount: number;
  repaymentPeriod: number;
}

export interface BankAccountDetails {
  bankName: string;
  groupsBankBranch: string;
  accountNumber: string;
}

export interface GroupDetails {
  natureOfGroup: string;
  basicInfo: {
    name: string;
    registrationNumber: string;
    dateFormed: Date;
    registrationCert: string;
    listOfMembersOnCert: string;
  };
  members?: {
    name: string;
    lastName: string;
    type: MemberType;
  }[];
  location?: {
    countyOfOperation: string;
    constituency: string;
    ward: string;
    meetingPoint: string;
    nearestLandmark: string;
  };
  background?: {
    purpose: string;
    keyActivities: string;
    creditHistory: string;
  };
}

export interface businessDetails {
  information: {
    natureOfBusiness: string;
    type: string; // maybe a type of businesses
    operationPeriod: number; // in months
  };
  performance: {
    averageMonthIncome: number;
    costOfGoodsPerMonth: number;
    rent: number;
    salaries: number;
    transportCosts: number;
    netSurplus: number;
  };
}

export interface GeneralDetails {
  applicationId: string;
  status: Status;
  user: string; // currently user email
}

export interface Application {
  generalDetails: GeneralDetails;
  loanDetails?: LoanDetails;
  bankAccountDetails?: BankAccountDetails;
  groupDetails?: GroupDetails;
  businessDetails?: businessDetails;
}
/* Replace with new data structure when new one is done */
const DUMMY_DATA: Application[] = [...dummyApplications];

interface ApplicationData {
  generalDetails: GeneralDetails;
  groupData?: GroupData;
  members?: MembersData;
}

interface GroupData {
  basics: {
    groupName: string;
    groupRegistrationNumber: string;
    dateFormed: Date;
    groupRegistrationCertificate: string;
    listOfMembersOnCertificate: string;
  };
  background: {
    groupBackground: string[];
    keyActivitiesOfTheGroup: string[];
    groupCreditHistory: string;
  };
  location: {
    countyOfOperation: string;
    constituency: string;
    ward: string;
    meetingPoint: string;
    nearestLandmark: string;
  };
}

export interface Member {
  fullname: string;
  nationalIdCode: string;
  gender: GenderType;
  type: MemberType;
  phoneNumber: string;
  photoOfId: string;
  disability?: {
    certificateOfDisability: string;
    pwdNumber?: string;
  };
}

export interface MembersData {
  natureOfTheGroup: string;
  members: Member[];
}

const test: ApplicationData[] = [];
globalThis.dummyApplicationsTest = globalThis.dummyApplicationsTest || [];
const dummyApplicationsTest = globalThis.dummyApplicationsTest;

export async function getApplications() {
  return Promise.resolve(DUMMY_DATA);
}

export async function getApplicationById(id: string) {
  return Promise.resolve(
    DUMMY_DATA.find((app) => app.generalDetails.applicationId === id),
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

  DUMMY_DATA.push({ generalDetails });
  dummyApplicationsTest.push({ generalDetails });

  console.log(dummyApplicationsTest);

  return Promise.resolve(generalDetails);
}

export async function updateApplicationGroupData(id: string, data: GroupData) {
  const session = await auth();
  const applicationIndex = dummyApplicationsTest.findIndex(
    (app) =>
      app.generalDetails.applicationId === id &&
      app.generalDetails.user === session?.user?.email,
  );

  const application = dummyApplicationsTest[applicationIndex];

  console.log({ dummyApplicationsTest });

  /* this should not happen */
  if (applicationIndex === -1 || !application) {
    throw new Error("Application not found");
  }

  const newApplicationData: ApplicationData = {
    ...application,
    groupData: data,
  };

  // update application data
  test[applicationIndex] = newApplicationData;

  return Promise.resolve(newApplicationData);
}
