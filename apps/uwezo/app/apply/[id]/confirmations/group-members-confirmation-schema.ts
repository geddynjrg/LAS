import { z } from "zod";

export const groupMembersConfirmationDataSchema = z.object({
  id: z.string().min(1, "Application ID is required"),
  selectedMembers: z
    .string()
    .transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selected members must be an array",
        });
        return z.NEVER;
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON format for selected members",
        });
        return z.NEVER;
      }
    })
    .pipe(
      z.array(z.string().min(1, "Member ID cannot be empty"))
        .min(1, "At least one member must be selected")
        .max(50, "Too many members selected")
    ),
  redirectTo: z.string().optional(),
});

export type GroupMembersConfirmationData = z.infer<
  typeof groupMembersConfirmationDataSchema
>; 