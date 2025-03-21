import { generateUUID } from "@/lib/data/dummy-data";

export type ValidationStatus = "alert" | "success" | "pending";
export type SexType = "M" | "F" | "I";
export type NatureOfBirth = "LiveBirth" | "StillBirth";

export interface Person {
  id: string;
  firstName?: string;
  lastName?: string;
  sex?: SexType;
  natureOfBirth?: NatureOfBirth;
  dob?: string;
  validationStatus?: ValidationStatus;
  middleName?: string;
  age?: string;
  email?: string;
  weightOnBirth?: string;
  placeOfBirth?: string;
  healthInstitution?: string;
  birthSublocation?: string;
  birthSublocationDistrict?: string;
  residenceDistrict?: string;
  residenceSublocation?: string;
  nationalId?: string;
  citizenship?: string;
  nationality?: string;
  maritalStatus?: string;
  education?: string;
  fatherName?: string;
  father?: string | Person;
  mother?: string | Person;
  siblings?: string[] | Person[];
  children?: string[] | Person[];
  informant?: string | Person;
  spouse?: string | Person;
  phone?: string;
  phoneCode?: string;
  passportNumber?: string;
  natureOfRelation?: string;
  capacityOfInformant?: string;
  informantType?: string;
}

export let persons: Person[] = [
  {
    id: "1",
    firstName: "Mary",
    lastName: "Otieno",
    middleName: "Maisha",
    dob: "1990-02-02T11:00:00.000Z",
    natureOfBirth: "LiveBirth",
    sex: "F",
    nationalId: "2934873249",
    citizenship: "Kenyan",
    nationality: "Kenyan",
    maritalStatus: "Married",
    education: "Master’s degree",
    phone: "1123 67464",
    phoneCode: "+254",
    spouse: "3",
    children: ["3", "4", "5"],
    father: "6",
    fatherName: "Waweru",
    validationStatus: "success",
  },
  {
    id: "2",
    firstName: "John",
    lastName: "Otieno",
    dob: "1990-01-01T11:00:00.000Z",
    natureOfBirth: "LiveBirth",
    sex: "M",
    nationalId: "2934873249",
    citizenship: "Kenyan",
    nationality: "Kenyan",
    education: "Master’s degree",
    phone: "734 88347",
    phoneCode: "+254",
    spouse: "2",
    children: ["3", "4", "5"],
    validationStatus: "alert",
  },
  {
    id: "3",
    firstName: "David",
    lastName: "Otieno",
    dob: "2022-04-23T11:00:00.000Z",
    natureOfBirth: "LiveBirth",
    sex: "M",
    weightOnBirth: "3.1 kg",
    placeOfBirth: "Kajiado County Referral Hospital",
    mother: "1",
    father: "2",
    siblings: ["4", "5"],
    validationStatus: "alert",
  },
  {
    id: "4",
    firstName: "Grace",
    lastName: "Otieno",
    dob: "2024-07-12T11:00:00.000Z",
    natureOfBirth: "LiveBirth",
    sex: "F",
    siblings: ["3", "5"],
    weightOnBirth: "3.1 kg",
    placeOfBirth: "Kajiado County Referral Hospital",
    mother: "1",
    father: "2",
    validationStatus: "alert",
  },
  {
    id: "5",
    firstName: "Paul",
    lastName: "Otieno",
    dob: "2018-01-01T11:00:00.000Z",
    natureOfBirth: "LiveBirth",
    sex: "M",
    siblings: ["3", "4"],
    mother: "1",
    father: "2",
    validationStatus: "success",
  },
  {
    id: "6",
    firstName: "Waweru",
    lastName: "",
    dob: "1956-01-01T11:00:00.000Z",
    natureOfBirth: "LiveBirth",
    phone: "1123 67464",
    phoneCode: "+254",
    sex: "M",
    children: ["1"],
    weightOnBirth: "3.1 kg",
    placeOfBirth: "Kajiado County Referral Hospital",
    validationStatus: "success",
  },
];

export type BirthRegistrationsTypes =
  | "child"
  | "mother"
  | "father"
  | "informant";

export type BirthRegistrationStore = {
  child: Person[];
} & {
  [K in Exclude<BirthRegistrationsTypes, "child">]: Person;
};

declare global {
  var personsStore: Person[];
  var birthRegistrationStore: BirthRegistrationStore;
}

globalThis.personsStore = globalThis.personsStore || persons;
globalThis.birthRegistrationStore = globalThis.birthRegistrationStore || {
  child: [{ id: generateUUID() }] as Person[],
  mother: { id: generateUUID() } as Person,
  father: { id: generateUUID() } as Person,
  informant: { id: generateUUID() } as Person,
};

export const personsStore: Person[] = globalThis.personsStore;
export let birthRegistrationStore: BirthRegistrationStore =
  globalThis.birthRegistrationStore;

export function resetBirthRegistrationStore() {
  globalThis.birthRegistrationStore = {
    child: [{ id: generateUUID() }] as Person[],
    mother: { id: generateUUID() } as Person,
    father: { id: generateUUID() } as Person,
    informant: { id: generateUUID() } as Person,
  };

  birthRegistrationStore = globalThis.birthRegistrationStore;
}
