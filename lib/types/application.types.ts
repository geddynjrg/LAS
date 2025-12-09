import { ApplicationStatus } from '@/generated/prisma';
import type { ValidFile } from '@workspace/ui/lib/zod';

export type Status = ApplicationStatus;

export type MemberType = string;

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
  id?: string;
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
  confirmation_status?: 'confirmed' | 'declined' | 'pending' | 'sent' | 'failed';
  confirmation_token?: string | null;
  confirmation_sent_at?: number | null;
  confirmation_confirmed_at?: number | null;
}

export interface MembersData {
  natureOfTheGroup: string;
  members: Member[];
}

export interface LoanConditionsData {
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