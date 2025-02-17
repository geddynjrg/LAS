"use server";

import { z } from "zod";

import { ActionResponse } from "@workspace/ui/types/action";

const applyStep1Schema = z.object({
  firstName: z.string().nonempty(),
  middleName: z.string().nonempty(),
  surname: z.string().min(1),
});

export type ApplyStep1 = z.infer<typeof applyStep1Schema>;
export type ApplyStep1Response = ActionResponse<ApplyStep1>;

export async function applyStep1(
  _prevState: ApplyStep1Response | null,
  formData: FormData,
): Promise<ApplyStep1Response> {
  const values: ApplyStep1 = {
    firstName: formData.get("firstName") as string,
    middleName: formData.get("middleName") as string,
    surname: formData.get("surname") as string,
  };

  console.log("submit", values);
  // dummy wait
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { success, data, error } = applyStep1Schema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  console.log("submit success", data);
  // TODO: Send data to the server

  return { success };
}
