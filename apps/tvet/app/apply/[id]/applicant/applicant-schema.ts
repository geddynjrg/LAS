import { z } from "zod";

import { validFile } from "@workspace/ui/lib/zod";

export const FILE_ACCEPT = {
  "image/*": [".jpg", ".png"],
  "application/pdf": [".pdf"],
};
export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

const sex = z.enum(["male", "female", "intersex"]);
const idType = z.enum(["national-id", "birth-certificate", "alien-id"]);
const phone = z.object({
  callingCode: z.string().nonempty(),
  phone: z.string().nonempty(),
});

export const applicantSchema = z.object({
  firstName: z.string().nonempty(),
  middleName: z.string().optional(),
  surname: z.string().min(1),
  sex: sex,
  dateOfBirth: z.coerce.date(),
  idType: idType,
  phones: z.array(phone),
  email: z.union([z.literal(""), z.string().email()]),
  personWithDisabilities: z.union([z.literal("on"), z.undefined()]),
  county: z.string().nonempty(),
  subCounty: z.string().nonempty(),
  ward: z.string().nonempty(),

  // idType === "national-id"
  nationalId: z.string().optional(),

  // idType === "birth-certificate"
  birthCertificateNumber: z.string().optional(),
  birthCertificateFile: validFile(FILE_ACCEPT, MAX_FILE_SIZE).optional(),

  // idType === "alien-id"
  alienId: z.string().optional(),
  alienIdIsRefugee: z.union([z.literal("on"), z.undefined()]),

  // personWithDisabilities === "on"
  natureOfDisability: z.string().optional(),
  disabilityCardNumber: z.string().optional(),
  disabilityCardPicture: validFile(FILE_ACCEPT, MAX_FILE_SIZE).optional(),
  disabilityLevel: z.string().optional(),
  disabilityDescription: z.string().optional(),
});

export type ApplicantSchema = z.infer<typeof applicantSchema>;

export const dummyDisabilities = [
  { label: "Hearing", value: "hearing" },
  { label: "Visual", value: "visual" },
  { label: "Physical", value: "physical" },
  { label: "Mental", value: "mental" },
  { label: "Speech", value: "speech" },
  { label: "Other", value: "other" },
];

export const dummyDisabilityLevels = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export const dummyCounties = [
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
