export type ValidationStatus = "alert" | "success" | "pending";
export type SexType = "M" | "F";
export type NautreOfBirth = "LiveBirth" | "StillBirth";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  sex: SexType;
  dob: string;
  validationStatus: ValidationStatus;
  middleName?: string;
  age?: string;
  weightOnBirth?: string;
  placeOfBirth?: string;
  nationalId?: string;
  citizenship?: string;
  nationality?: string;
  maritalStatus?: string;
  education?: string;
  father?: string | Person;
  mother?: string | Person;
  siblings?: string[] | Person[];
  children?: string[] | Person[];
  spouse?: string | Person;
  phone?: string;
  phoneCode?: string;
}

export let persons: Person[] = [
  {
    id: "1",
    firstName: "Mary",
    lastName: "Otieno",
    middleName: "Maisha",
    dob: "1990-02-02T11:00:00.000Z",
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
    validationStatus: "success",
  },
  {
    id: "2",
    firstName: "John",
    lastName: "Otieno",
    dob: "1990-01-01T11:00:00.000Z",
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
    sex: "F",
    siblings: ["3", "5"],
    mother: "1",
    father: "2",
    validationStatus: "alert",
  },
  {
    id: "5",
    firstName: "Paul",
    lastName: "Otieno",
    dob: "2018-01-01T11:00:00.000Z",
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
    phone: "1123 67464",
    phoneCode: "+254",
    sex: "M",
    children: ["1"],
    validationStatus: "success",
  },
];

declare global {
  var personsStore: Person[];
}

globalThis.personsStore = globalThis.personsStore || persons;

export const personsStore: Person[] = globalThis.personsStore;
