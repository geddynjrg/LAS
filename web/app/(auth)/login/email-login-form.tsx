'use client';

import { type Login, loginSchema } from '@/app/(auth)/login/login-schema';
import { Alert } from '@workspace/ui/components/alert';
import { Field, Form, SubmitButton } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import { type FC, useEffect } from 'react';

export interface EmailLoginFormProps {
  action: FormAction<Login>;
  redirectTo?: string;
}

export const EmailLoginForm: FC<EmailLoginFormProps> = ({
  action,
  redirectTo,
}) => {
  const t = useTranslations('LoginPage');
  const [state, formAction, isPending] = useForm(action, loginSchema);

  // Navigate on successful login
  useEffect(() => {
    if (state.success) {
      // The server action has already created the session
      // Hard navigation to ensure cookies are properly read
      window.location.href = redirectTo ?? '/dashboard';
    }
  }, [redirectTo, state.success]);

  return (
    <Form action={formAction} className="space-y-6" autoComplete="on">
      {state.message && (
        <Alert variant="error" className="mb-4">
          {state.message}
        </Alert>
      )}

      <Field
        state={state}
        name="email"
        label={t('email')}
        required
        control={(props) => <Input placeholder="email@email.com" {...props} />}
      />

      <Field
        state={state}
        name="password"
        label={t('password')}
        required
        control={(props) => (
          <Input
            type="password"
            placeholder="••••••••••••••••••••"
            {...props}
          />
        )}
      />

      <input type="hidden" name="loginType" value="email" />
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      <SubmitButton className="w-full" disabled={isPending}>
        {t('login')}
      </SubmitButton>
    </Form>
  );
};
