"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  motherSchema,
  type MotherSchema,
} from "@/app/add/mother/mother-schema";
import { editPerson } from "@/lib/services/birth-registration-service";

export const motherAction: FormAction<MotherSchema> = async (
  _prev,
  formData,
) => {
  const values = getFormZodDataValues(formData, motherSchema);

  const { error, data, success } = motherSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }
  editPerson("mother", data);
  if (values.maritalStatus === 'Married') {
  	redirect(`/add/father`);
  } else {
	editPerson("father", undefined);
	redirect(`/add/informant`);
  }
};
