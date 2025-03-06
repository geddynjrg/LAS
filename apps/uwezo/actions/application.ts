"use server";

export type Status = "PENDING" | "IN_REVIEW" | "UNSUBMITTED";

export type MemberType = "Chairman" | "Secretary" | "Member";

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
    countryOfOperation: string;
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

export interface Application {
  applicationId: string;
  status: Status;
  loanDetails?: LoanDetails;
  bankAccountDetails?: BankAccountDetails;
  groupDetails: GroupDetails;
  businessDetails?: businessDetails;
}

const DUMMY_DATA: Application[] = [
  {
    applicationId: "LFR-D5SP6A",
    status: "IN_REVIEW",
    loanDetails: {
      purpose: "To buy more stock",
      type: "Group Loan",
      amount: 200000,
      repaymentPeriod: 6,
    },
    bankAccountDetails: {
      bankName: "Equity Bank",
      groupsBankBranch: "Kisumu",
      accountNumber: "1234567890",
    },
    groupDetails: {
      natureOfGroup: "Chama",
      basicInfo: {
        name: "Beacon",
        registrationNumber: "123456",
        dateFormed: new Date("2021-01-01"),
        registrationCert: "Cert",
        listOfMembersOnCert: "Members",
      },
      members: [
        {
          name: "John",
          lastName: "Doe",
          type: "Chairman",
        },
        {
          name: "Jane",
          lastName: "Doe",
          type: "Secretary",
        },
        {
          name: "Alice",
          lastName: "Doe",
          type: "Member",
        },
        {
          name: "Alice",
          lastName: "Doe",
          type: "Member",
        },
      ],
      location: {
        countryOfOperation: "Kenya",
        constituency: "Kisumu",
        ward: "Kisumu Central",
        meetingPoint: "Kisumu CBD",
        nearestLandmark: "Kisumu Post Office",
      },
      background: {
        purpose: "To buy more stock",
        keyActivities: "Selling",
        creditHistory: "Good",
      },
    },
    businessDetails: {
      information: {
        natureOfBusiness: "Retail",
        type: "Grocery",
        operationPeriod: 12,
      },
      performance: {
        averageMonthIncome: 100000,
        costOfGoodsPerMonth: 50000,
        rent: 10000,
        salaries: 20000,
        transportCosts: 5000,
        netSurplus: 15000,
      },
    },
  },
  {
    applicationId: "LFR-F66Q6A",
    status: "PENDING",
    loanDetails: {
      purpose: "To buy more stock",
      type: "Group Loan",
      amount: 420000,
      repaymentPeriod: 6,
    },
    bankAccountDetails: {
      bankName: "KCB",
      groupsBankBranch: "Nairobi",
      accountNumber: "0987654321",
    },
    groupDetails: {
      natureOfGroup: "Chama",
      basicInfo: {
        name: "Candle",
        registrationNumber: "654321",
        dateFormed: new Date("2021-01-01"),
        registrationCert: "Cert",
        listOfMembersOnCert: "Members",
      },
      members: [
        {
          name: "John",
          lastName: "Doe",
          type: "Chairman",
        },
        {
          name: "Jane",
          lastName: "Doe",
          type: "Secretary",
        },
        {
          name: "Alice",
          lastName: "Doe",
          type: "Member",
        },
        {
          name: "Alice",
          lastName: "Doe",
          type: "Member",
        },
      ],
      location: {
        countryOfOperation: "Kenya",
        constituency: "Nairobi",
        ward: "Kasarani",
        meetingPoint: "Kasarani",
        nearestLandmark: "Kasarani Police Station",
      },
      background: {
        purpose: "To buy more stock",
        keyActivities: "Selling",
        creditHistory: "Good",
      },
    },
    businessDetails: {
      information: {
        natureOfBusiness: "Retail",
        type: "Grocery",
        operationPeriod: 12,
      },
      performance: {
        averageMonthIncome: 100000,
        costOfGoodsPerMonth: 50000,
        rent: 10000,
        salaries: 20000,
        transportCosts: 5000,
        netSurplus: -15000,
      },
    },
  },
  {
    applicationId: "RFG-G845SD",
    status: "UNSUBMITTED",
    loanDetails: {
      purpose: "To buy more stock",
      type: "Group Loan",
      amount: 200000,
      repaymentPeriod: 6,
    },
    groupDetails: {
      natureOfGroup: "Chama",
      basicInfo: {
        name: "Sunlight",
        registrationNumber: "123456",
        dateFormed: new Date("2021-01-01"),
        registrationCert: "Cert",
        listOfMembersOnCert: "Members",
      },
    },
  },
];

export async function getApplications() {
  return Promise.resolve(DUMMY_DATA);
}

export async function getApplicationById(id: string) {
  return Promise.resolve(DUMMY_DATA.find((app) => app.applicationId === id));
}
