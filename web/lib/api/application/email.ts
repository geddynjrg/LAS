import { api, validate } from "@/lib/api/utils";
import { 
  EmailRequestSchema, 
  EmailSuccessResponseSchema,
  type EmailRequest
} from "@/lib/api/schema/application/application.schema";

export async function sendApplicationEmail(applicationId: string, emailData: EmailRequest) {
  // Validate the request data
  const validatedData = EmailRequestSchema.parse(emailData);

  const res = await api.POST("/api/v1/application/{application}/email", {
    params: {
      path: { application: applicationId },
    },
    body: validatedData,
  });

  if (!res.response.ok) {
    throw new Error(`Failed to send email: ${res.response.statusText}`);
  }

  return validate(res, EmailSuccessResponseSchema);
}