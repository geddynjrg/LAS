import { RegisterResponseSchema } from '@/lib/api/schema/response/auth-response.schema';
import { api, validate } from '@/lib/api/utils';

export async function register(data: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await api.POST('/api/v1/user/register', {
    body: {
      name: [{ value: data.username }],
      mail: [{ value: data.email }],
      pass: [{ value: data.password }],
    },
  });

  if (!res.response.ok) {
    // Try to get error message from response
    let errorMessage = `Registration failed: ${res.response.statusText}`;

    try {
      const contentType = res.response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        // If response is not JSON (like HTML), provide a more specific error
        if (res.response.status === 404) {
          errorMessage = 'Registration service is not available';
        } else if (res.response.status === 401) {
          errorMessage = 'Authentication required for registration';
        } else if (res.response.status === 400) {
          errorMessage =
            'Invalid registration data. Please check your email and password';
        }
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
    }

    throw new Error(errorMessage);
  }

  return validate(res, RegisterResponseSchema);
}
