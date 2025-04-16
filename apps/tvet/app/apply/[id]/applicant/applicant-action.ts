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
import { createApplication, updateApplication } from "@/lib/api/application";

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

  const res =
    id === "new"
      ? await createApplication({
          ...data,
          step_type: "applicant",
          disability_card_picture: await prepareFileForUpload(
            data.disability_card_picture,
          ),

          // TODO: fix once api is updated
          applicant_phone_number: values.phones?.[0]
            ? Object.values(values.phones[0]).join("")
            : "",
          applicant_id_number: data.applicant_id_number ?? "",
          applicant_email: data.applicant_email ?? "",
        })
      : await updateApplication(id, {
          ...data,
          step_type: "applicant",
          disability_card_picture: await prepareFileForUpload(
            data.disability_card_picture,
          ),

          // TODO: fix once api is updated
          applicant_phone_number: values.phones?.[0]
            ? Object.values(values.phones[0]).join("")
            : "",
          applicant_id_number: data.applicant_id_number ?? "",
          applicant_email: data.applicant_email ?? "",
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

  console.log(
    id === "new" ? "createApplication response" : "updateApplication response",
    res,
  );

  redirect(`/apply/${res?.data?.application_id}/guardian`);
};
