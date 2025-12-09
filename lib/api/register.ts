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
    // Use the error data from openapi-fetch
    let errorMessage = `Registration failed: ${res.response.statusText}`;

    if (res.error) {
      // res.error already contains the parsed error response
      console.warn('[API] Registration error details:', res.error);

      // Extract error message from the error response
      if (typeof res.error === 'object' && res.error !== null) {
        const errorData = res.error as any;
        errorMessage = errorData.message || errorMessage;

        // Handle Drupal-specific error structure
        if (errorData.error && typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        }
      }
    } else {
      // Fallback error handling based on status code
      switch (res.response.status) {
        case 400:
          errorMessage = 'Invalid registration data. Please check your input.';
          break;
        case 401:
          errorMessage = 'Authentication required for registration';
          break;
        case 404:
          errorMessage = 'Registration service is not available';
          break;
        case 409:
          errorMessage = 'User with this email already exists';
          break;
        case 422:
          errorMessage = 'Validation failed. Please check your input data.';
          break;
        case 500:
          errorMessage = 'Server error during registration';
          break;
        default:
          errorMessage = `Registration failed: ${res.response.status} ${res.response.statusText}`;
      }
    }

    throw new Error(errorMessage);
  }

  return validate(res, RegisterResponseSchema);
}

export async function registerECitizen(userData: {
  email: string;
  name: string;
  id_number: string;
  mobile: string;
  krapin: string;
  dob: string;
  gender: string;
  auth_provider: string;
}) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        username: userData.email, // Use email as username
        password: null, // No password for eCitizen users
        auth_provider: 'ecitizen',
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return await response.json();
}
