'use server';

import { getApplicationById } from '@/lib/data/application';
import {
  type ValidationResult,
  validateApplicationForSubmission,
} from '@/lib/validation/application-validation';

export async function validateApplicationSubmission(
  id: string,
): Promise<ValidationResult> {
  try {
    const application = await getApplicationById(id);

    if (!application) {
      return {
        isValid: false,
        errors: ['Application not found'],
        missingFields: [],
        warnings: [],
      };
    }

    return validateApplicationForSubmission(application);
  } catch (error) {
    return {
      isValid: false,
      errors: [
        error instanceof Error
          ? error.message
          : 'Failed to validate application',
      ],
      missingFields: [],
      warnings: [],
    };
  }
}
