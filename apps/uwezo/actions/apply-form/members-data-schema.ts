import { z } from "zod";

export const membersDataSchema = z.object({
  natureOfGroup: z.string().nonempty(),
});

export type MembersData = z.infer<typeof membersDataSchema>;
