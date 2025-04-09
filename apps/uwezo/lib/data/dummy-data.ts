import { type ApplicationData, type Member } from "@/lib/data/application";

export const dummyCounty = [
  {
    name: "Nairobi",
    code: 47,
    constituencies: [
      "Westlands",
      "Dagoretti North",
      "Dagoretti South",
      "Lang'ata",
      "Kibra",
      "Roysambu",
      "Kasarani",
      "Ruaraka",
      "Embakasi South",
      "Embakasi North",
      "Embakasi Central",
      "Embakasi East",
      "Embakasi West",
      "Makadara",
      "Kamukunji",
      "Starehe",
      "Mathare",
    ],
  },
  {
    name: "Mombasa",
    code: 1,
    constituencies: [
      "Changamwe",
      "Jomvu",
      "Kisauni",
      "Nyali",
      "Likoni",
      "Mvita",
    ],
  },
  {
    name: "Kisumu",
    code: 42,
    constituencies: [
      "Kisumu East",
      "Kisumu West",
      "Kisumu Central",
      "Seme",
      "Nyando",
      "Muhoroni",
      "Nyakach",
    ],
  },
  {
    name: "Kiambu",
    code: 22,
    constituencies: [
      "Gatundu South",
      "Gatundu North",
      "Juja",
      "Thika Town",
      "Ruiru",
      "Githunguri",
      "Kiambu",
      "Kiambaa",
      "Kabete",
      "Kikuyu",
      "Limuru",
      "Lari",
    ],
  },
  {
    name: "Nakuru",
    code: 32,
    constituencies: [
      "Naivasha",
      "Gilgil",
      "Bahati",
      "Subukia",
      "Rongai",
      "Nakuru Town West",
      "Nakuru Town East",
      "Kuresoi South",
      "Kuresoi North",
      "Molo",
      "Njoro",
    ],
  },
  {
    name: "Uasin Gishu",
    code: 27,
    constituencies: [
      "Soy",
      "Turbo",
      "Moiben",
      "Ainabkoi",
      "Kapseret",
      "Kesses",
    ],
  },
  {
    name: "Machakos",
    code: 16,
    constituencies: [
      "Masinga",
      "Yatta",
      "Kangundo",
      "Matungulu",
      "Kathiani",
      "Mavoko",
      "Machakos Town",
      "Mwala",
    ],
  },
  {
    name: "Meru",
    code: 12,
    constituencies: [
      "Igembe South",
      "Igembe Central",
      "Igembe North",
      "Tigania West",
      "Tigania East",
      "North Imenti",
      "Buuri",
      "Central Imenti",
      "South Imenti",
    ],
  },
  {
    name: "Kakamega",
    code: 37,
    constituencies: [
      "Lugari",
      "Likuyani",
      "Malava",
      "Lurambi",
      "Navakholo",
      "Mumias West",
      "Mumias East",
      "Matungu",
      "Butere",
      "Khwisero",
      "Shinyalu",
      "Ikolomani",
    ],
  },
  {
    name: "Bungoma",
    code: 39,
    constituencies: [
      "Mt. Elgon",
      "Sirisia",
      "Kabuchai",
      "Bumula",
      "Kanduyi",
      "Webuye East",
      "Webuye West",
      "Kimilili",
      "Tongaren",
    ],
  },
];

export const dummyApplications: ApplicationData[] = [
  {
    generalDetails: {
      applicationId: "APP-12345",
      user: "email@email.com",
      status: "PENDING",
    },
    groupData: {
      basics: {
        groupName: "Sunrise Farmers Group",
        groupRegistrationNumber: "REG-2024-001",
        dateFormed: new Date("2022-05-10"),
        groupRegistrationCertificate: new File(
          ["Sample content"],
          "sample.txt",
          { type: "text/plain" },
        ),
        listOfMembersOnCertificate: new File(["Sample content"], "sample.txt", {
          type: "text/plain",
        }),
      },
      background: {
        purposeOfTheGroup: ["Welfare issues"],
        keyActivitiesOfTheGroup: ["Value chain"],
        groupCreditHistory: new File(["Sample content"], "sample.txt", {
          type: "text/plain",
        }),
        valueChain: ["Blue economy", "Cotton and textiles"],
        tableBanking: {},
      },
      location: {
        countyOfOperation: "Nakuru",
        constituency: "Bahati",
        ward: "Lanet",
        meetingPoint: "Lanet Social Hall",
        nearestLandmark: "Lanet Market",
      },
    },
    members: {
      natureOfTheGroup: "youth",
      members: [
        {
          fullname: "John Doe",
          nationalIdCode: "12345678",
          gender: "Male",
          type: "Chairman",
          phoneNumber: "0712345678",
          photoOfId: new File(["Sample content"], "sample.txt", {
            type: "text/plain",
          }),
          disability: {
            certificateOfDisability: "",
            pwdNumber: undefined,
          },
        },
      ],
    },
    loanConditions: {
      purposeOfLoan: ["Table banking"],
      loanType: "Wezesha",
      loanAmount: 10000,
      repaymentPeriod: 12,
      bankName: "Equity Bank",
      bankBranch: "Nakuru",
      accountNumber: "0123456789",
    },
    proposedBusiness: {
      natureOfBusiness: "Start-up",
      businessType: ["Agriculture"],
      yearsInBusiness: 5,
      averageIncome: 80000,
      costOfGoods: 30000,
      rentForBusiness: 5000,
      salaries: 10000,
      transportForBusinessStock: 7000,
    },
  },
  {
    generalDetails: {
      applicationId: "APP-12346",
      user: "email@email.com",
      status: "IN_REVIEW",
    },
    groupData: {
      basics: {
        groupName: "In review Group",
        groupRegistrationNumber: "REG-2024-001",
        dateFormed: new Date("2022-05-10"),
        groupRegistrationCertificate: new File(
          ["Sample content"],
          "sample.txt",
          { type: "text/plain" },
        ),
        listOfMembersOnCertificate: new File(["Sample content"], "sample.txt", {
          type: "text/plain",
        }),
      },
      background: {
        purposeOfTheGroup: ["Other"],
        keyActivitiesOfTheGroup: ["Table banking"],
        groupCreditHistory: new File(["Sample content"], "sample.txt", {
          type: "text/plain",
        }),
        valueChain: [],
        tableBanking: {
          tableBankingExperience: 3,
          tableBankingShareContribution: 50000,
          tableBankingTotalLoanedOut: 150000,
          tableBankingTotalRevolvingFund: 200000,
        },
      },
      location: {
        countyOfOperation: "Nakuru",
        constituency: "Bahati",
        ward: "Lanet",
        meetingPoint: "Lanet Social Hall",
        nearestLandmark: "Lanet Market",
      },
    },
    members: {
      natureOfTheGroup: "People with disabilities",
      members: [
        {
          fullname: "John Doe",
          nationalIdCode: "12345678",
          gender: "Male",
          type: "Chairman",
          phoneNumber: "0712345678",
          photoOfId: new File(["Sample content"], "sample.txt", {
            type: "text/plain",
          }),
          disability: {
            certificateOfDisability: "",
            pwdNumber: undefined,
          },
        },
      ],
    },
    loanConditions: {
      purposeOfLoan: ["Common group project"],
      loanType: "Endeleza",
      loanAmount: 30000,
      repaymentPeriod: 12,
      bankName: "Equity Bank",
      bankBranch: "Nakuru",
      accountNumber: "0123456789",
    },
    proposedBusiness: {
      natureOfBusiness: "Start-up",
      businessType: ["Trade"],
      yearsInBusiness: 5,
      averageIncome: 80000,
      costOfGoods: 30000,
      rentForBusiness: 5000,
      salaries: 10000,
      transportForBusinessStock: 7000,
    },
  },
  {
    generalDetails: {
      applicationId: "APP-12347",
      user: "email@email.com",
      status: "UNSUBMITTED",
    },
    groupData: {
      basics: {
        groupName: "test name Group",
        groupRegistrationNumber: "REG-2024-001",
        dateFormed: new Date("2022-05-10"),
        groupRegistrationCertificate: new File(
          ["Sample content"],
          "sample.txt",
          { type: "text/plain" },
        ),
        listOfMembersOnCertificate: new File(["Sample content"], "sample.txt", {
          type: "text/plain",
        }),
      },
      background: {
        purposeOfTheGroup: ["Income generating activities"],
        keyActivitiesOfTheGroup: ["Table banking"],
        groupCreditHistory: new File(["Sample content"], "sample.txt", {
          type: "text/plain",
        }),
        valueChain: [],
        tableBanking: {
          tableBankingExperience: 3,
          tableBankingShareContribution: 50000,
          tableBankingTotalLoanedOut: 150000,
          tableBankingTotalRevolvingFund: 200000,
        },
      },
      location: {
        countyOfOperation: "Nakuru",
        constituency: "Bahati",
        ward: "Lanet",
        meetingPoint: "Lanet Social Hall",
        nearestLandmark: "Lanet Market",
      },
    },
    members: {
      natureOfTheGroup: "Woman",
      members: [
        {
          fullname: "John Doe",
          nationalIdCode: "12345678",
          gender: "Male",
          type: "Chairman",
          phoneNumber: "0712345678",
          photoOfId: new File(["Sample content"], "sample.txt", {
            type: "text/plain",
          }),
          disability: {
            certificateOfDisability: "",
            pwdNumber: undefined,
          },
        },
      ],
    },
    loanConditions: {
      purposeOfLoan: ["Table banking"],
      loanType: "Wezesha",
      loanAmount: 99000,
      repaymentPeriod: 12,
      bankName: "Equity Bank",
      bankBranch: "Nakuru",
      accountNumber: "0123456789",
    },
    proposedBusiness: {
      natureOfBusiness: "Expansion",
      businessType: ["Manufacturing"],
      yearsInBusiness: 5,
      averageIncome: 80000,
      costOfGoods: 30000,
      rentForBusiness: 5000,
      salaries: 10000,
      transportForBusinessStock: 7000,
    },
  },
];

export const dummyMembers: Omit<Member, "type" | "phoneNumber">[] = [
  {
    fullname: "John Doe",
    nationalIdCode: "12345678",
    gender: "Male",
    photoOfId: new File(["Sample content"], "sample.txt", {
      type: "text/plain",
    }),
  },
  {
    fullname: "Jane Wanjiku",
    nationalIdCode: "87654321",
    gender: "Female",
    photoOfId: new File(["Sample content"], "sample.txt", {
      type: "text/plain",
    }),
  },
  {
    fullname: "Ali Mohamed",
    nationalIdCode: "11223344",
    gender: "Male",
    photoOfId: new File(["Sample content"], "sample.txt", {
      type: "text/plain",
    }),
  },
];
