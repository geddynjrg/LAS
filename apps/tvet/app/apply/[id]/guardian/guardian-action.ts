"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import {
  getFormZodDataValues,
  prepareFileForUpload,
} from "@workspace/ui/lib/utils";

import {
  guardianSchema,
  type GuardianSchema,
} from "@/app/apply/[id]/guardian/guardian-schema";
import { updateApplication } from "@/lib/api/application";
import { formatPhoneNumber } from "@/lib/phone";

export const guardianAction: FormAction<GuardianSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();
  const values = getFormZodDataValues(formData, guardianSchema);

  if (!id) {
    return {
      success: false,
      errors: {},
      message: "ID is required",
      values,
    };
  }

  const { error, data, success } = guardianSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  const res = await updateApplication(id, {
    ...data,
    step_type: "guardian",
    guardian_phone_number:
      values.phones?.filter((p) => !!p.phone).map(formatPhoneNumber) ?? [],

    // id type fields
    guardian_id_type: data.id_type,
    guardian_id_number: data.id_number,
    guardian_birth_certificate_number: data.birth_certificate_number,
    guardian_birth_certificate_file: await prepareFileForUpload(
      data.birth_certificate_file,
    ),
    guardian_alien_id_number: data.alien_id_number,
    guardian_is_refugee: data.is_refugee,
  });

  if (res.error) {
    console.warn("guardianAction error", res.error);

    return {
      success: false,
      errors: {},
      message: res.error.message ?? "Something went wrong",
      values,
    };
  }

  redirect(`/apply/${id}/course`);
};
