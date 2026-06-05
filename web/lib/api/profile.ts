import { UserProfileResponseSchema } from '@/lib/api/schema/response/auth-response.schema';
import { api, validate } from '@/lib/api/utils';
import { AuthenticationError } from '@/lib/errors/auth-error';

export async function getProfile() {
  const res = await api.GET('/api/v1/user/profile', {});

  if (!res.response.ok) {
    if (res.response.status === 401) {
      throw new AuthenticationError('Authentication required');
    }
    if (res.response.status === 404) {
      // Return a minimal profile structure for users without profiles
      console.log('Profile not found, returning empty profile');
      return {
        data: {
          email: undefined,
          phoneNumber: undefined,
          name: undefined,
          roles: [],
          created: undefined,
          last_access: undefined,
        },
        meta: {},
      };
    }
    throw new Error(`Failed to get profile: ${res.response.statusText}`);
  }

  return validate(res, UserProfileResponseSchema);
}
