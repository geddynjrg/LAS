"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import {
  memberSchema,
  type Member,
} from "@/app/apply/[id]/members/member-schema";

export const memberAction: FormAction<Member> = async (_prev, formData) => {
  const values = getFormDataValues(formData, memberSchema);

  const { success, error } = memberSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  return { values };
};
