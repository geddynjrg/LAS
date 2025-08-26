'use server';

import { type Reset, resetSchema } from '@/app/(auth)/reset/reset-schema';
import { passwordResetRequest } from '@/lib/api/password-reset-request';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormDataValues } from '@workspace/ui/lib/utils';

export const resetAction: FormAction<Reset> = async (_prev, formData) => {
  const values = getFormDataValues(formData, resetSchema);

  const { data, success, error } = resetSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const res = await passwordResetRequest({ email: data.email });

    return {
      success: true,
      message: res.data.message,
    };
  } catch (error) {
    console.warn('Error during password reset request:', error);

    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : 'Unknown error',
      values,
    };
  }
};
