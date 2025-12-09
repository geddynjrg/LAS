import { LoginResponseSchema } from '@/lib/api/schema/response/auth-response.schema';
import { api, validate } from '@/lib/api/utils';

export async function login(data: { username: string; password: string }) {
  const res = await api.POST('/api/v1/user/login', {
    body: {
      username: data.username,
      password: data.password,
    },
  });

  if (!res.response.ok) {
    if (res.response.status === 401) {
      throw new Error('Invalid email or password');
    }
    if (res.response.status === 400) {
      throw new Error('Please check your email and password');
    }
    throw new Error(`Login failed: ${res.response.statusText}`);
  }

  return validate(res, LoginResponseSchema);
}

export async function loginWithECitizen(userData: {
  name: string;
  id_number: string;
  mobile: string;
  email: string;
  krapin: string;
  dob: string;
  gender: string;
}) {
  const res = await api.POST('/api/v1/auth/ecitizen', {
    body: userData,
  });

  if (!res.response.ok) {
    if (res.response.status === 401) {
      throw new Error('eCitizen authentication failed');
    }
    if (res.response.status === 400) {
      throw new Error('Invalid eCitizen user data');
    }
    throw new Error(`eCitizen login failed: ${res.response.statusText}`);
  }

  return validate(res, LoginResponseSchema);
}
