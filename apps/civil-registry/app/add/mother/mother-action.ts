"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import {
  motherSchema,
  type MotherSchema,
} from "@/app/add/mother/mother-schema";
import type { Person } from "@/lib/schema/person-schema";
import { createNewPerson } from "@/lib/services/birth-registration-service";

export const motherAction: FormAction<MotherSchema> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, motherSchema);

  const { error, data, success } = motherSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }
  createNewPerson("mother", data as Partial<Person>);

  redirect(`/add/father`);
};
