import {
  type ApplicationPostRequest,
  ApplicationPostRequestSchema,
  type ApplicationPostResponse,
  ApplicationPostResponseSchema,
  type ErrorResponse,
  ErrorResponseSchema,
} from '@/lib/api/schema/application/application.schema';

/**
 * Create or update an application via the external API
 * This is used for syncing applications from the local database to the external API
 * @param data The application data
 * @returns The API response
 */
export async function createOrUpdateApplication(
  data: ApplicationPostRequest,
): Promise<ApplicationPostResponse | ErrorResponse> {
  try {
    console.log('Preparing to create/update application with data:', data);

    // Validate the data against the schema
    const validatedData = ApplicationPostRequestSchema.parse(data);

    console.log('Creating/updating application with data:', validatedData);

    //log the member details
    // validatedData.members.forEach((member, index) => {
    //   console.log(`Member ${index + 1}:`, {
    //     fullname: member.fullname,    
    //     phoneNumber: member.phoneNumber,
    //     requiresConfirmation: member.requiresConfirmation,
    //   });
    // });


    // Direct fetch to avoid the redirect middleware in api utils
    const response = await fetch(`${process.env.API_URL}/api/v1/application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.EXTERNAL_API_KEY || '',
      },
      body: JSON.stringify(validatedData),
    });

    const result = await response.json();

    // log the raw response for debugging
    console.log('this is the API response:', {
      api_url: `${process.env.API_URL}/api/v1/application`,
      status: response.status,
      body: result,
    });

    if (!response.ok) {
      console.error('API error:', response.status, result);

      // Try to parse as ErrorResponse
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

    // Validate and return the successful response
    try {
      const successResult = ApplicationPostResponseSchema.parse(result);
      return successResult;
    } catch (validationError) {
      // If validation fails, return the raw data but log the error
      console.warn('Response validation failed:', validationError);
      return result as ApplicationPostResponse;
    }
  } catch (error) {
    console.error('Error creating/updating application:', error);

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
