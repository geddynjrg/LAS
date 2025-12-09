// lib/api/profile.ts
import { UserProfileResponseSchema } from '@/lib/api/schema/response/auth-response.schema';
import { api, validate } from '@/lib/api/utils';
import { AuthenticationError } from '@/lib/errors/auth-error';
import { getSession, invalidateSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function getProfile() {
  const token = await getSession();
  const cookieStore = await cookies();
  const displayName = cookieStore.get('user_display_name')?.value;

  // eCitizen user — return real name from Drupal (via cookie)
  if (token?.startsWith('ecitizen|')) {
    return {
      data: {
        email: null,
        phoneNumber: null,
        name: displayName || 'eCitizen User',
        roles: ['applicant'],
        created: null,
        last_access: null,
      },
      meta: {},
    };
  }

  const res = await api.GET('/api/v1/user/profile', {});

  if (!res.response.ok) {
    if (res.response.status === 401) {
      await invalidateSession();
      throw new AuthenticationError('Authentication required');
    }
    if (res.response.status === 404) {
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
