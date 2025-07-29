import { z } from "zod";

/**
 * File upload schema - accepts either a number (file ID), string (file path), or object with base64 data
 */
export const FileUploadSchema = z.union([
  z.number(),
  z.string(),
  z.object({
    filename: z.string().describe("File name"),
    data: z.string().describe("Base64 encoded file content"),
  }),
]);

/**
 * Group member input schema
 */
export const GroupMemberInputSchema = z.object({
  name: z.string().describe("Member full name"),
  id_number: z.string().describe("National ID number"),
  gender: z.enum(["male", "female", "other"]),
  phone_number: z.string().describe("Phone number"),
  position: z.union([z.string(), z.number()]).optional(),
  photo_member_id: FileUploadSchema.optional(),
  person_with_disability: z.boolean().default(false),
  pwd_number: z.string().optional().describe("PWD registration number"),
  certificate_disability: FileUploadSchema.optional(),
  requires_confirmation: z.boolean().default(false),
});

/**
 * Application POST request schema
 */
export const ApplicationPostRequestSchema = z.object({
  application_id: z
    .string()
    .optional()
    .describe("Existing application ID for updates (optional)"),
  identifier_type: z
    .enum(["EMAIL", "PHONE", "NAME"])
    .describe("Type of identifier used to identify the application owner"),
  owner_identifier: z
    .string()
    .optional()
    .describe(
      "Identifier of the application owner (email or name, used when identifier_type is EMAIL or NAME)",
    ),
  phone_number: z
    .string()
    .optional()
    .describe(
      "Phone number of the application owner (used when identifier_type is PHONE)",
    ),
  status: z
    .enum([
      "draft",
      "submitted",
      "under_review",
      "approved",
      "rejected",
      "disbursed",
      "closed",
    ])
    .default("draft")
    .describe("Application status"),

  // Group information
  group_name: z.string().describe("Name of the group"),
  group_registration_number: z
    .string()
    .describe("Official registration number"),
  date_registered: z
    .string()
    .describe("Date when group was registered (YYYY-MM-DD format)"),
  group_registration_certificate: FileUploadSchema.optional(),
  list_of_members_certificate: FileUploadSchema.optional(),
  group_background: z
    .array(z.union([z.string(), z.number()]))
    .optional()
    .describe("Group background categories (taxonomy term names or IDs)"),
  key_activities: z
    .array(z.enum(["value_chain", "table_banking", "other"]))
    .optional()
    .describe("Key activities of the group"),
  value_chain: z
    .array(z.union([z.string(), z.number()]))
    .optional()
    .describe("Value chain categories"),
  table_banking_duration: z
    .string()
    .optional()
    .describe("Duration of table banking practice"),
  monthly_share_contribution: z
    .number()
    .optional()
    .describe("Monthly share contribution amount"),
  total_amount_loaned: z
    .number()
    .optional()
    .describe("Total amount loaned out"),
  total_revolving_fund: z
    .number()
    .optional()
    .describe("Total revolving fund amount"),
  other_activities: z
    .string()
    .optional()
    .describe("Other activities description"),
  group_credit_history: z.array(FileUploadSchema).optional(),

  // Location
  county: z.union([z.string(), z.number()]).optional(),
  constituency: z.union([z.string(), z.number()]).optional(),
  ward: z.string().optional().describe("Ward name"),
  meeting_point: z.string().optional().describe("Where the group meets"),
  nearest_landmark: z
    .string()
    .optional()
    .describe("Nearest landmark to meeting point"),
  nature_of_group: z.enum(["youth", "pwd", "women"]).optional(),

  // Members
  group_members: z
    .array(GroupMemberInputSchema)
    .optional()
    .describe("Group members"),

  // Loan information
  purpose_of_loan: z.union([z.string(), z.number()]).optional(),
  loan_type: z.union([z.string(), z.number()]).optional(),
  loan_amount: z.number().optional().describe("Requested loan amount in KSh"),
  proposed_repayment_period: z
    .number()
    .optional()
    .describe("Repayment period in months"),
  bank_name: z.union([z.string(), z.number()]).optional(),
  bank_branch: z.string().optional().describe("Bank branch name"),
  bank_account_number: z.string().optional().describe("Bank account number"),

  // Business information
  nature_of_business: z.enum(["startup", "expansion"]).optional(),
  business_type: z
    .array(z.union([z.string(), z.number()]))
    .optional()
    .describe("Business type categories"),
  years_in_operation: z.number().optional().describe("Years in operation"),
  average_income: z
    .number()
    .optional()
    .describe("Average monthly income in KES"),
  expenses: z
    .array(z.record(z.unknown()))
    .optional()
    .describe("Business expenses"),
});

/**
 * Application POST response schema
 */
export const ApplicationPostResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z
    .object({
      id: z.union([z.number(), z.string()]).optional().describe("Entity ID"),
      uuid: z.string().uuid().optional().describe("Entity UUID"),
      application_id: z.string().optional().describe("Application ID"),
      status: z.string().optional().describe("Application status"),
      group_name: z.string().optional().describe("Group name"),
      created: z
        .union([z.number(), z.string()])
        .optional()
        .describe("Creation timestamp"),
      changed: z
        .union([z.number(), z.string()])
        .optional()
        .describe("Last modified timestamp"),
    })
    .optional(),
});

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string().optional().describe("Error type"),
  message: z.string().optional().describe("Error message"),
  missing_fields: z
    .array(z.string())
    .optional()
    .describe("List of missing required fields"),
});

// Type exports
export type ApplicationPostRequest = z.infer<
  typeof ApplicationPostRequestSchema
>;
export type ApplicationPostResponse = z.infer<
  typeof ApplicationPostResponseSchema
>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type GroupMemberInput = z.infer<typeof GroupMemberInputSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
