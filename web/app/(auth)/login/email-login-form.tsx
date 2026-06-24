'use client';

import { type Login, loginSchema } from '@/app/(auth)/login/login-schema';
import { resolveReturnPath } from '@/lib/return-path';
import { Alert } from '@workspace/ui/components/alert';
import { Field, Form, SubmitButton } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import { type FC, useEffect, useState } from 'react';

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
  const [redirectTarget, setRedirectTarget] = useState(
    redirectTo ?? '/dashboard',
  );

  useEffect(() => {
    setRedirectTarget(resolveReturnPath(redirectTo));
  }, [redirectTo]);

  // Navigate on successful login
  useEffect(() => {
    if (state.success) {
      window.location.href = redirectTarget;
    }
  }, [redirectTarget, state.success]);

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
      {redirectTarget && (
        <input type="hidden" name="redirectTo" value={redirectTarget} />
      )}

      <SubmitButton className="w-full" disabled={isPending}>
        {t('login')}
      </SubmitButton>
    </Form>
  );
};
