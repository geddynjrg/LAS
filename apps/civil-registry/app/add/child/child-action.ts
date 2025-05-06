"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import {
  getFormDataValues,
  getFormZodDataValues,
} from "@workspace/ui/lib/utils";

import {
  multiChildSchema,
  type MultiChildSchema,
} from "@/app/add/child/child-schema";
import type { Person } from "@/lib/data/person";
import { editPerson } from "@/lib/services/birth-registration-service";

export const childAction: FormAction<MultiChildSchema> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, multiChildSchema);
  const zodValues = getFormZodDataValues(formData, multiChildSchema);

  const { error, data, success } = multiChildSchema.safeParse(zodValues);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  // data.children.forEach((child) => editPerson("child", child as Person));

  for (const child of data.children) {
    await editPerson("child", child as Person);
  }

  if (data?.children?.[0]?.abandoned) {
    await editPerson("mother", undefined);
    await editPerson("father", undefined);
    redirect(`/add/informant`);
  } else {
    redirect(`/add/mother`);
  }
};
