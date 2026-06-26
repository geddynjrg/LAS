'use server';

import {
  type ResetConfirm,
  resetConfirmSchema,
} from '@/app/(auth)/reset/confirm/reset-confirm-schema';
import { passwordReset } from '@/lib/api/password-reset';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormDataValues } from '@workspace/ui/lib/utils';

export const resetConfirmAction: FormAction<ResetConfirm> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, resetConfirmSchema);

  const { data, success, error } = resetConfirmSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const res = await passwordReset({
      uid: data.uid,
      timestamp: data.timestamp,
      hash: data.hash,
      new_password: data.password,
    });

    return {
      success: true,
      message: res.data.message,
    };
  } catch (err) {
    console.warn('Error during password reset:', err);

    return {
      success: false,
      errors: {},
      message: err instanceof Error ? err.message : 'Unknown error',
      values,
    };
  }
};
