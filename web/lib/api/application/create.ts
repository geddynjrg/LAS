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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    };

    const lmsApiUrl = process.env.LMS_API_URL?.replace(/\/$/, '') ?? '';
    const lmsHost = process.env.LMS_API_HOST;
    if (
      lmsHost &&
      lmsApiUrl &&
      apiUrl.replace(/\/$/, '') === lmsApiUrl
    ) {
      headers.Host = lmsHost;
    }

    const response = await fetch(`${apiUrl}/api/v1/application`, {
      method: 'POST',
      headers,
      body: JSON.stringify(validatedData),
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type') ?? '';

    let result: unknown;
    if (contentType.includes('application/json')) {
      try {
        result = JSON.parse(responseText);
      } catch {
        return {
          error: 'api_error',
          message: `Invalid JSON response from API (HTTP ${response.status})`,
        };
      }
    } else {
      const snippet = responseText.replace(/\s+/g, ' ').slice(0, 200);
      console.error(
        'API returned non-JSON response:',
        response.status,
        contentType,
        snippet,
      );
      const sizeHint =
        response.status === 413
          ? ' Request body too large — application files may exceed server limits.'
          : '';
      return {
        error: 'api_error',
        message: `API returned HTTP ${response.status} (${contentType || 'non-JSON'}).${sizeHint}`,
      };
    }

    if (!response.ok) {
      console.error('API error:', response.status, result);

      try {
        const errorResult = ErrorResponseSchema.parse(result);
        return errorResult;
      } catch {
        const err = result as { message?: string; error?: string };
        return {
          error: 'api_error',
          message: err.message || err.error || `Unknown API error (HTTP ${response.status})`,
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
