import { z } from "zod";

export const applyStep1Schema = z.object({
  firstName: z.string().nonempty(),
  middleName: z.string().nonempty(),
  surname: z.string().min(1),
});

export type ApplyStep1 = z.infer<typeof applyStep1Schema>;
