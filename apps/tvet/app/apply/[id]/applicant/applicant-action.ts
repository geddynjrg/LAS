"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import {
  getFormZodDataValues,
  prepareFileForUpload,
} from "@workspace/ui/lib/utils";

import {
  applicantSchema,
  type ApplicantSchema,
} from "@/app/apply/[id]/applicant/applicant-schema";
import { updateApplication } from "@/lib/api/application";
import { formatPhoneNumber } from "@/lib/phone";

export const applicantAction: FormAction<ApplicantSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();
  const values = getFormZodDataValues(formData, applicantSchema);

  if (!id) {
    return {
      success: false,
      errors: {},
      message: "ID is required",
      values,
    };
  }
  const { error, data, success } = applicantSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  const res = await updateApplication(id, {
    ...data,
    step_type: "applicant",
    disability_card_picture: await prepareFileForUpload(
      data.disability_card_picture,
    ),

    // @ts-ignore wait for the API fix
    birth_certificate_file: await prepareFileForUpload(
      data.birth_certificate_file,
    ),

    // TODO: fix once api is updated
    applicant_phone_number:
      values.phones?.filter((p) => !!p.phone).map(formatPhoneNumber) ?? [],
  });

  if (res.error) {
    console.warn("createApplication error", res.error);

    return {
      success: false,
      errors: {},
      message: res.error.message ?? "Something went wrong",
      values,
    };
  }

  console.log("save application response", res);

  redirect(`/apply/${res?.data?.application_id}/guardian`);
};
