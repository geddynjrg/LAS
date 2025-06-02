"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import {
  getFormZodDataValues,
  prepareFileForUpload,
} from "@workspace/ui/lib/utils";

import {
  uploadPaymentProofSchema,
  type UploadPaymentProofSchema,
} from "@/app/dashboard/application-card/upload-payment-proof-schema";
import { uploadPaymentProof } from "@/lib/api/payment";

export const uploadPaymentProofAction: FormAction<
  UploadPaymentProofSchema
> = async (_prev, formData) => {
  const id = formData.get("id")?.toString();
  const values = getFormZodDataValues(formData, uploadPaymentProofSchema);

  if (!id) {
    return {
      success: false,
      errors: {},
      message: "ID is required",
      values,
    };
  }

  const { error, data, success } = uploadPaymentProofSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  const res = await uploadPaymentProof({
    application_id: id,
    payment_proof: await prepareFileForUpload(data.payment_proof),
    type: data.type,
  });

  if (res.error) {
    return {
      success: false,
      errors: {
        payment_proof: [res.error.message ?? "Something went wrong"],
      },
      values,
    };
  }

  redirect(`/apply/${data.id}/success`);
};
