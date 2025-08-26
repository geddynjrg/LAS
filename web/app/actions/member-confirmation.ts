'use server';

import {
  getMemberDetails,
  processMemberConfirmation,
} from '@/lib/api/member-confirmation';
import {
  type ConfirmationActionData,
  ConfirmationActionSchema,
} from '@/lib/api/schema/member-confirmation.schema';
import type { FormAction } from '@workspace/ui/hooks/use-form';

/**
 * Get member details using confirmation token (no action)
 */
export const getMemberDetailsAction: FormAction<{ token: string }> = async (
  _prev,
  formData,
) => {
  const token = formData.get('token')?.toString();
  const values = { token: token || '' };

  try {
    if (!token) {
      return {
        success: false,
        errors: { token: ['Token is required'] },
        values,
      };
    }

    const response = await getMemberDetails(token);

    // Check if it's an error response
    if (!response.success) {
      return {
        success: false,
        errors: {
          token: [response.error.message],
        },
        values,
      };
    }

    // It's a success response
    return {
      success: true,
      data: response,
      values,
    };
  } catch (error) {
    console.error('Error fetching member details:', error);
    return {
      success: false,
      errors: {
        token: [
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
      },
      values,
    };
  }
};

/**
 * Process member confirmation response (confirm or decline)
 */
export const confirmMemberAction: FormAction<ConfirmationActionData> = async (
  _prev,
  formData,
) => {
  const token = formData.get('token')?.toString();
  const action = formData.get('action')?.toString() as 'confirmed' | 'declined';
  const values = { token: token || '', action: action || 'confirmed' };

  try {
    // Validate input data
    const validatedData = ConfirmationActionSchema.parse(values);

    const response = await processMemberConfirmation(
      validatedData.token,
      validatedData.action,
    );

    // Check if it's an error response
    if (!response.success) {
      return {
        success: false,
        errors: {
          action: [response.error.message],
        },
        values,
      };
    }

    // It's a success response
    return {
      success: true,
      data: response,
      values,
    };
  } catch (error) {
    console.error('Error processing confirmation:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      const validationErrors = error.message.includes('token')
        ? { token: [error.message] }
        : { action: [error.message] };

      return {
        success: false,
        errors: validationErrors,
        values,
      };
    }

    return {
      success: false,
      errors: {
        action: [
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
      },
      values,
    };
  }
};
