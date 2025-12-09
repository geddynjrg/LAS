import { PasswordResetRequestResponseSchema } from '@/lib/api/schema/response/auth-response.schema';
import { api, validate } from '@/lib/api/utils';

export async function passwordResetRequest(data: { email: string }) {
  const res = await api.POST('/api/v1/user/password/reset-request', {
    body: {
      email: data.email,
    },
  });

  return validate(res, PasswordResetRequestResponseSchema);
}
