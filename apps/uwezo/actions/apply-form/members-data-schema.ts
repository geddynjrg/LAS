import { z } from "zod";

export const membersDataSchema = z.object({
  natureOfGroup: z.string(),
  members: z.array(
    z.object({
      name: z.string(),
      lastName: z.string(),
      type: z.enum(["Chairman", "Secretary", "Member"]),
    }),
  ),
});

export type MembersData = z.infer<typeof membersDataSchema>;
