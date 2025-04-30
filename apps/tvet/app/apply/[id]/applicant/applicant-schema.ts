import { z } from "zod";

import { checkbox, validFile } from "@workspace/ui/lib/zod";

import {
  idTypeSChema,
  validateApplicantIdType,
} from "@/app/apply/[id]/id-type-schema";

export const FILE_ACCEPT = {
  "image/*": [".jpg", ".png"],
  "application/pdf": [".pdf"],
};
export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export const sex = z.enum(["male", "female", "intersex"]);

export const disabilityNature = z.enum([
  "visual",
  "hearing",
  "physical",
  "cognitive",
  "multiple",
  "mental",
  "speech",
  "other",
]);

export const disabilityLevel = z.enum([
  "mild",
  "moderate",
  "severe",
  "profound",
]);

const phone = z.object({
  callingCode: z.string().nonempty(),
  phone: z.string().nonempty(),
});

export const applicantSchema = idTypeSChema
  .extend({
    applicant_first_name: z.string().min(1),
    applicant_middle_name: z.string().optional(),
    applicant_surname: z.string().min(1),
    applicant_sex: sex,
    applicant_date_of_birth: z.string().trim().date(),
    applicant_email: z.union([z.literal(""), z.string().email()]),
    applicant_county: z.string().trim().nonempty(),
    applicant_subcounty: z.string().trim().nonempty(),
    applicant_ward: z.string().trim().nonempty(),
    phones: z.array(phone),
    applicant_disability: checkbox(),

    // applicant_disability === true
    disability_nature: disabilityNature.optional(),
    disability_card_number: z.string().optional(),
    disability_card_picture: validFile(FILE_ACCEPT, MAX_FILE_SIZE).optional(),
    disability_level: disabilityLevel.optional(),
    disability_requirements: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    validateApplicantIdType(data, ctx);
    validateApplicantDisabilities(data, ctx);
  });

export type ApplicantSchema = z.infer<typeof applicantSchema>;

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

function validateApplicantDisabilities(
  data: ApplicantSchema,
  ctx: z.RefinementCtx,
) {
  if (!data.applicant_disability) {
    return;
  }

  if ((data.disability_card_number?.trim()?.length ?? 0) < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      type: "string",
      minimum: 1,
      inclusive: true,
      path: ["disability_card_number"],
    });
  }

  if (!data.disability_card_picture) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      type: "string",
      minimum: 1,
      inclusive: true,
      path: ["disability_card_picture"],
    });
  }
}
