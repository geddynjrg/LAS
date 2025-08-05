import { getTranslations } from "next-intl/server";
import { z } from "zod";

const OtpVerifyResponseSchema = z.object({
  success: z.boolean(),
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  user: z
    .object({
      uid: z.number().optional(),
      email: z.string().optional(),
      name: z.string().optional(),
      phone_number: z.string().optional(),
      created: z.boolean().optional(),
    })
    .optional(),
});

export async function verifyOtp(data: {
  request_id: string;
  otp_code: string;
}) {
  const t = await getTranslations("LoginPage");

  // Use direct fetch to avoid authentication headers for login endpoints
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL environment variable is required");
  }
  const OTP_VERIFY = `${apiUrl.replace(/\/$/, "")}/api/auth/otp/verify`;

  let response: Response;

  if (process.env.NODE_ENV === "development") {
    // In development, temporarily set the environment variable for this specific request
    const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    try {
      response = await fetch(OTP_VERIFY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: data.request_id,
          otp_code: data.otp_code,
        }),
      });
    } finally {
      // Restore the original value
      if (originalValue !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }
  } else {
    response = await fetch(OTP_VERIFY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_id: data.request_id,
        otp_code: data.otp_code,
      }),
    });
  }

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error(t("invalidOtpFormat"));
    }
    if (response.status === 401) {
      throw new Error(t("invalidOrExpiredOtp"));
    }
    if (response.status === 429) {
      throw new Error(t("tooManyVerificationAttempts"));
    }
    throw new Error(t("otpVerificationFailed"));
  }

  const responseData = await response.json();
  const validation = OtpVerifyResponseSchema.safeParse(responseData);

  if (!validation.success) {
    console.warn(
      "[OTP Verify] Response Schema Error:",
      validation.error.toString(),
      responseData,
    );
  }

  return responseData as z.infer<typeof OtpVerifyResponseSchema>;
}
