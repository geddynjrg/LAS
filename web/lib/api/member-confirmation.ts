// import {
//   type MemberConfirmationErrorResponse,
//   MemberConfirmationErrorResponseSchema,
//   type MemberConfirmationResponse,
//   MemberConfirmationResponseSchema,
// } from '@/lib/api/schema/member-confirmation.schema';
// import { api } from '@/lib/api/utils';

// /**
//  * Convert technical error messages to translation keys
//  */
// function getErrorTranslationKey(technicalMessage: string): string {
//   const message = technicalMessage.toLowerCase();

//   if (
//     message.includes('invalid token format') ||
//     message.includes('malformed token')
//   ) {
//     return 'ConfirmationPage.errors.invalidTokenFormat';
//   }

//   if (
//     message.includes('token not found') ||
//     message.includes('token expired')
//   ) {
//     return 'ConfirmationPage.errors.tokenExpired';
//   }

//   if (
//     message.includes('already confirmed') ||
//     message.includes('already processed')
//   ) {
//     return 'ConfirmationPage.errors.alreadyProcessed';
//   }

//   if (message.includes('unauthorized') || message.includes('permission')) {
//     return 'ConfirmationPage.errors.unauthorized';
//   }

//   if (message.includes('network') || message.includes('connection')) {
//     return 'ConfirmationPage.errors.networkError';
//   }

//   // For unknown errors, provide a generic key
//   return 'ConfirmationPage.errors.unknownError';
// }

// /**
//  * Get member details using confirmation token
//  * @param token SMS confirmation token
//  * @returns Member confirmation data
//  */
// export async function getMemberDetails(
//   token: string,
// ): Promise<MemberConfirmationResponse> {
//   const res = await api.GET('/api/v1/member/response/{token}', {
//     params: {
//       path: { token },
//       // No query params means just get details
//     },
//   });

//   // Handle API errors first
//   if (res.error) {
//     console.warn('[API] Error:', res.response.status, res.error);

//     // Try to parse the error response
//     const errorValidation = MemberConfirmationErrorResponseSchema.safeParse(
//       res.error,
//     );
//     if (errorValidation.success) {
//       // Use translation key instead of message
//       const translationKey = getErrorTranslationKey(
//         errorValidation.data.error.message,
//       );
//       return {
//         ...errorValidation.data,
//         error: {
//           ...errorValidation.data.error,
//           message: translationKey,
//         },
//       };
//     }

//     // Fallback error response
//     const originalMessage =
//       ((res.error as Record<string, unknown>)?.message as string) ||
//       'Failed to fetch member details';
//     const errorResponse: MemberConfirmationErrorResponse = {
//       success: false,
//       error: {
//         message: getErrorTranslationKey(originalMessage),
//         code: res.response?.status || 500,
//       },
//       timestamp: Math.floor(Date.now() / 1000),
//     };
//     return errorResponse;
//   }

//   // Validate successful response
//   const validation = MemberConfirmationResponseSchema.safeParse(res.data);
//   if (!validation.success) {
//     console.warn('[API] Response validation failed:', validation.error);
//     return {
//       success: false,
//       error: {
//         message: 'ConfirmationPage.errors.serverError',
//         code: 500,
//       },
//       timestamp: Math.floor(Date.now() / 1000),
//     };
//   }

//   return validation.data;
// }

// /**
//  * Process member confirmation response (confirm or decline)
//  * @param token SMS confirmation token
//  * @param action Action to take: "confirmed" or "declined"
//  * @returns Member confirmation response
//  */
// export async function processMemberConfirmation(
//   token: string,
//   action: 'confirmed' | 'declined',
// ): Promise<MemberConfirmationResponse> {
//   const res = await api.GET('/api/v1/member/response/{token}', {
//     params: {
//       path: { token },
//       query: { action },
//     },
//   });

//   // Handle API errors first
//   if (res.error) {
//     console.warn('[API] Error:', res.response.status, res.error);

//     // Try to parse the error response
//     const errorValidation = MemberConfirmationErrorResponseSchema.safeParse(
//       res.error,
//     );
//     if (errorValidation.success) {
//       // Use translation key instead of message
//       const translationKey = getErrorTranslationKey(
//         errorValidation.data.error.message,
//       );
//       return {
//         ...errorValidation.data,
//         error: {
//           ...errorValidation.data.error,
//           message: translationKey,
//         },
//       };
//     }

//     // Fallback error response
//     const originalMessage =
//       ((res.error as Record<string, unknown>)?.message as string) ||
//       'Failed to process confirmation';
//     const errorResponse: MemberConfirmationErrorResponse = {
//       success: false,
//       error: {
//         message: getErrorTranslationKey(originalMessage),
//         code: res.response?.status || 500,
//       },
//       timestamp: Math.floor(Date.now() / 1000),
//     };
//     return errorResponse;
//   }

//   // Validate successful response
//   const validation = MemberConfirmationResponseSchema.safeParse(res.data);
//   if (!validation.success) {
//     console.warn('[API] Response validation failed:', validation.error);
//     return {
//       success: false,
//       error: {
//         message: 'ConfirmationPage.errors.serverError',
//         code: 500,
//       },
//       timestamp: Math.floor(Date.now() / 1000),
//     };
//   }

//   return validation.data;
// }

import {
  type MemberConfirmationErrorResponse,
  MemberConfirmationErrorResponseSchema,
  type MemberConfirmationResponse,
  MemberConfirmationResponseSchema,
} from '@/lib/api/schema/member-confirmation.schema';
import { api } from '@/lib/api/utils';

/**
 * Convert technical error messages to translation keys
 */
function getErrorTranslationKey(technicalMessage: string): string {
  const message = technicalMessage.toLowerCase();

  if (
    message.includes('invalid token format') ||
    message.includes('malformed token')
  ) {
    return 'ConfirmationPage.errors.invalidTokenFormat';
  }

  if (
    message.includes('token not found') ||
    message.includes('token expired')
  ) {
    return 'ConfirmationPage.errors.tokenExpired';
  }

  if (
    message.includes('already confirmed') ||
    message.includes('already processed')
  ) {
    return 'ConfirmationPage.errors.alreadyProcessed';
  }

  if (message.includes('unauthorized') || message.includes('permission')) {
    return 'ConfirmationPage.errors.unauthorized';
  }

  if (message.includes('network') || message.includes('connection')) {
    return 'ConfirmationPage.errors.networkError';
  }

  // For unknown errors, provide a generic key
  return 'ConfirmationPage.errors.unknownError';
}

/**
 * Get member details using confirmation token
 * @param token SMS confirmation token
 * @returns Member confirmation data
 */
// export async function getMemberDetails(
//   token: string,
// ): Promise<MemberConfirmationResponse> {
//   // CHANGED: Use the new web database endpoint for token validation
//   const res = await api.GET('/api/v1/member/confirm/{token}', {
//     params: {
//       path: { token },
//     },
//   });

//   // Handle API errors first
//   if (res.error) {
//     console.warn('[API] Error fetching member details:', res.response?.status, res.error);

//     // Try to parse the error response
//     const errorValidation = MemberConfirmationErrorResponseSchema.safeParse(
//       res.error,
//     );
//     console.error('[API] Error member confirmation response:', errorValidation.error);
//     if (errorValidation.success) {

//       // Use translation key instead of message
//       const translationKey = getErrorTranslationKey(
//         errorValidation.data.error.message,
//       );
//       return {
//         ...errorValidation.data,
//         error: {
//           ...errorValidation.data.error,
//           message: translationKey,
//         },
//       };
//     }

//     // Fallback error response
//     const originalMessage =
//       ((res.error as Record<string, unknown>)?.message as string) ||
//       'Failed to fetch member details';
//     const errorResponse: MemberConfirmationErrorResponse = {
//       success: false,
//       error: {
//         message: getErrorTranslationKey(originalMessage),
//         code: res.response?.status || 500,
//       },
//       timestamp: Math.floor(Date.now() / 1000),
//     };
//     return errorResponse;
//   }

//   // Validate successful response
//   const validation = MemberConfirmationResponseSchema.safeParse(res.data);
//   if (!validation.success) {
//     console.warn('[API] Response validation failed:', validation.error);
//     return {
//       success: false,
//       error: {
//         message: 'ConfirmationPage.errors.serverError',
//         code: 500,
//       },
//       timestamp: Math.floor(Date.now() / 1000),
//     };
//   }

//   return validation.data;
// }

// In lib/api/member-confirmation.ts

/**
 * Get member details using confirmation token
 */
export async function getMemberDetails(
  token: string,
): Promise<MemberConfirmationResponse> {
  const res = await api.GET('/api/v1/member/confirm/{token}', {
    params: {
      path: { token },
    },
  });

  // Handle API errors first
 if (res.error) {
    console.warn('[API] Error processing confirmation:', res.response?.status, res.error);

    // Try to parse the error response
    const errorValidation = MemberConfirmationErrorResponseSchema.safeParse(
      res.error,
    );

    console.error('[API] Error validation response:', errorValidation.error);
    if (errorValidation.success) {
      // Use translation key instead of message
      const translationKey = getErrorTranslationKey(
        errorValidation.data.error.message,
      );
      return {
        ...errorValidation.data,
        error: {
          ...errorValidation.data.error,
          message: translationKey,
        },
      };
    }

    // Fallback error response
    const originalMessage =
      ((res.error as Record<string, unknown>)?.message as string) ||
      'Failed to fetch member details';
    const errorResponse: MemberConfirmationErrorResponse = {
      success: false,
      error: {
        message: getErrorTranslationKey(originalMessage),
        code: res.response?.status || 500,
      },
      timestamp: Math.floor(Date.now() / 1000),
    };
    return errorResponse;
  }

  // Validate successful response
  const validation = MemberConfirmationResponseSchema.safeParse(res.data);
  if (!validation.success) {
    console.warn('[API] Response validation failed:', validation.error);
    return {
      success: false,
      error: {
        message: 'ConfirmationPage.errors.serverError',
        code: 500,
      },
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  return validation.data;
}

/**
 * Process member confirmation response (confirm or decline)
 * @param token SMS confirmation token
 * @param action Action to take: "confirmed" or "declined"
 * @returns Member confirmation response
 */
export async function processMemberConfirmation(
  token: string,
  action: 'confirmed' | 'declined',
): Promise<MemberConfirmationResponse> {
  // CHANGED: Use the new web database endpoint for processing confirmation
  const res = await api.POST('/api/v1/member/confirm/{token}/action', {
    params: {
      path: { token },
    },
    body: {
      action,
    },
  });

  // Handle API errors first
  if (res.error) {
    console.warn('[API] Error processing confirmation:', res.response?.status, res.error);

    // Try to parse the error response
    const errorValidation = MemberConfirmationErrorResponseSchema.safeParse(
      res.error,
    );
    if (errorValidation.success) {
      // Use translation key instead of message
      const translationKey = getErrorTranslationKey(
        errorValidation.data.error.message,
      );
      return {
        ...errorValidation.data,
        error: {
          ...errorValidation.data.error,
          message: translationKey,
        },
      };
    }

    // Fallback error response
    const originalMessage =
      ((res.error as Record<string, unknown>)?.message as string) ||
      'Failed to process confirmation';
    const errorResponse: MemberConfirmationErrorResponse = {
      success: false,
      error: {
        message: getErrorTranslationKey(originalMessage),
        code: res.response?.status || 500,
      },
      timestamp: Math.floor(Date.now() / 1000),
    };
    return errorResponse;
  }

  // Validate successful response
  const validation = MemberConfirmationResponseSchema.safeParse(res.data);
  if (!validation.success) {
    console.warn('[API] Response validation failed:', validation.error);
    return {
      success: false,
      error: {
        message: 'ConfirmationPage.errors.serverError',
        code: 500,
      },
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  return validation.data;
}