"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import { childSchema, type ChildSchema } from "@/app/add/child/child-schema";
import type { Person } from "@/lib/schema/person-schema";
import { createNewPerson } from "@/lib/services/birth-registration-service";

export const childAction: FormAction<ChildSchema> = async (_prev, formData) => {
  const values = getFormDataValues(formData, childSchema);

  const { error, data, success } = childSchema.safeParse(values);
  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }
  createNewPerson("child", data as Partial<Person>);

  redirect(`/add/mother`);
};
