import {
  type ApplicationPostRequest,
  ApplicationPostRequestSchema,
  type ApplicationPostResponse,
  ApplicationPostResponseSchema,
  type ErrorResponse,
  ErrorResponseSchema,
} from '@/lib/api/schema/application/application.schema';

async function sendToApi(
  data: ApplicationPostRequest,
  apiUrl: string,
  apiKey: string,
): Promise<ApplicationPostResponse | ErrorResponse> {
  try {
    const validatedData = ApplicationPostRequestSchema.parse(data);

    const response = await fetch(`${apiUrl}/api/v1/application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(validatedData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('API error:', response.status, result);

      try {
        const errorResult = ErrorResponseSchema.parse(result);
        return errorResult;
      } catch {
        return {
          error: 'api_error',
          message: result.message || result.error || 'Unknown API error',
        };
      }
    }

    try {
      const successResult = ApplicationPostResponseSchema.parse(result);
      return successResult;
    } catch (validationError) {
      console.warn('Response validation failed:', validationError);
      return result as ApplicationPostResponse;
    }
  } catch (error) {
    console.error('Error sending to API:', error);

    if (error instanceof Error) {
      return {
        error: 'validation_error',
        message: error.message,
      };
    }

    return {
      error: 'unknown_error',
      message: 'An unknown error occurred',
    };
  }
}

/**
 * Create or update an application via the backend API
 */
export async function createOrUpdateApplication(
  data: ApplicationPostRequest,
): Promise<ApplicationPostResponse | ErrorResponse> {
  return sendToApi(
    data,
    process.env.API_URL || '',
    process.env.EXTERNAL_API_KEY || '',
  );
}

/**
 * Send to LMS API
 */
export async function sendToLms(
  data: ApplicationPostRequest,
): Promise<ApplicationPostResponse | ErrorResponse> {
  return sendToApi(
    data,
    process.env.LMS_API_URL || '',
    process.env.LMS_API_KEY || '',
  );
}
