import { getLocale } from "next-intl/server";

import { api } from "@/lib/api/utils";

export async function getPaymentInfo(path: { application_id: string }) {
  return (
    (
      await api.GET("/api/v1/application/{application_id}/payment-info", {
        params: {
          header: { "X-Language": await getLocale() },
          path,
        },
      })
    ).data?.data || null
  );
}

export async function getPaymentInfoPdf(path: { application_id: string }) {
  return await api.GET(
    "/api/v1/application/{application_id}/payment-info-pdf",
    { params: { path }, parseAs: "blob" },
  );
}

export async function uploadPaymentProof(data: {
  application_id: string;
  payment_proof: {
    data: string;
    filename: string;
  };
}) {
  return api.POST("/api/v1/application/{application_id}/payment-proof", {
    params: {
      header: { "X-Language": await getLocale() },
      path: { application_id: data.application_id },
    },
    body: {
      payment_proof: data.payment_proof,
      // TODO: why is this required by API?
      payment_reference: "?????",
    },
  });
}
