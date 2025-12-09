'use server';

import { type Signup, signupSchema } from '@/app/(auth)/signup/signup-schema';
import { register } from '@/lib/api/register';
import { createSession } from '@/lib/session';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormDataValues } from '@workspace/ui/lib/utils';

export const signupAction: FormAction<Signup> = async (_prev, formData) => {
  const values = getFormDataValues(formData, signupSchema);

  const { data, success, error } = signupSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const res = await register({
      username: data.email, // Using email as username for Uwezo
      email: data.email,
      password: data.password,
    });

    await createSession({
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    });
  } catch (error) {
    console.warn('Error during signup:', error);

    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : 'Unknown error',
      values,
    };
  }

  return { success };
};
