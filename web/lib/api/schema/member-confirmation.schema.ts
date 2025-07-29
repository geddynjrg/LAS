import { z } from "zod";

// Member confirmation data schemas based on the OpenAPI spec
export const ConfirmedMemberInfoSchema = z.object({
  id: z.coerce.number().describe("Member entity ID"),
  name: z.string().describe("Member name"),
  phone_number: z.string().describe("Member phone number"),
  confirmation_status: z
    .enum(["confirmed", "declined", "pending", "sent"])
    .describe("Updated confirmation status"),
  confirmation_confirmed_at: z.coerce
    .number()
    .nullable()
    .optional()
    .describe("Unix timestamp when member confirmed"),
});

export const ConfirmedApplicationInfoSchema = z.object({
  id: z.coerce.number().nullable().optional().describe("Application entity ID"),
  application_id: z
    .string()
    .nullable()
    .optional()
    .describe("Application identifier"),
  group_name: z.string().nullable().optional().describe("Name of the group"),
});

export const MemberConfirmationDataSchema = z.object({
  member: ConfirmedMemberInfoSchema,
  application: ConfirmedApplicationInfoSchema,
  action: z
    .enum(["confirmed", "declined", "pending", "sent"])
    .optional()
    .describe("The action that was taken"),
  confirmation_timestamp: z.coerce
    .number()
    .optional()
    .describe("Unix timestamp when confirmation was processed"),
});

export const MemberConfirmationSuccessResponseSchema = z.object({
  success: z
    .literal(true)
    .describe("Indicates if the confirmation was successful"),
  message: z.string().optional().describe("Human-readable success message"),
  data: MemberConfirmationDataSchema,
});

export const MemberConfirmationErrorResponseSchema = z.object({
  success: z.literal(false).describe("Indicates the request failed"),
  error: z.object({
    message: z.string().describe("Error message"),
    code: z.number().describe("HTTP status code"),
  }),
  timestamp: z.number().describe("Unix timestamp when error occurred"),
});

export const MemberConfirmationResponseSchema = z.union([
  MemberConfirmationSuccessResponseSchema,
  MemberConfirmationErrorResponseSchema,
]);

// TypeScript types derived from schemas
export type ConfirmedMemberInfo = z.infer<typeof ConfirmedMemberInfoSchema>;
export type ConfirmedApplicationInfo = z.infer<
  typeof ConfirmedApplicationInfoSchema
>;
export type MemberConfirmationData = z.infer<
  typeof MemberConfirmationDataSchema
>;
export type MemberConfirmationSuccessResponse = z.infer<
  typeof MemberConfirmationSuccessResponseSchema
>;
export type MemberConfirmationErrorResponse = z.infer<
  typeof MemberConfirmationErrorResponseSchema
>;
export type MemberConfirmationResponse = z.infer<
  typeof MemberConfirmationResponseSchema
>;

// Form data for confirmation action
export const ConfirmationActionSchema = z.object({
  token: z.string().min(1, "Token is required"),
  action: z.enum(["confirmed", "declined"]),
});

export type ConfirmationActionData = z.infer<typeof ConfirmationActionSchema>;
