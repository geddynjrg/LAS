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
  type: "application" | "course";
  payment_proof: {
    data: string;
    filename: string;
  };
}) {
  return api.POST("/api/v1/application/{application_id}/payment-proof", {
    params: {
      header: { "X-Language": await getLocale() },
      path: { application_id: data.application_id },
      query: { type: data.type },
    },
    body: {
      payment_proof: data.payment_proof,
    },
  });
}

export async function initiateMpesaPayment(data: {
  application_id: string;
  phone_number: string;
}) {
  return await api.POST("/api/v1/application/{application_id}/mpesa-payment", {
    params: {
      query: {
        type: "application",
      },
      path: { application_id: data.application_id },
    },
    body: {
      phone_number: data.phone_number,
    },
  });
}

export async function checkMpesaPaymentStatus(data: {
  transaction_id: string;
}) {
  return await api.GET("/api/v1/mpesa-payment/{checkout_request_id}", {
    params: {
      path: { checkout_request_id: data.transaction_id },
    },
  });
}
