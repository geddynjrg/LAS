'use client';

import { resetConfirmAction } from '@/app/(auth)/reset/confirm/reset-confirm-action';
import { resetConfirmSchema } from '@/app/(auth)/reset/confirm/reset-confirm-schema';
import { Alert } from '@workspace/ui/components/alert';
import { Container } from '@workspace/ui/components/container';
import { Field, Form, SubmitButton } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Underline } from '@workspace/ui/components/underline';
import { useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const t = useTranslations('ResetConfirmPage');
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useForm(
    resetConfirmAction,
    resetConfirmSchema,
  );

  const uid = searchParams.get('uid') ?? '';
  const timestamp = searchParams.get('timestamp') ?? '';
  const hash = searchParams.get('hash') ?? '';
  const hasValidLink = Boolean(uid && timestamp && hash);

  if (state.success) {
    return (
      <Container className="max-w-[500px] pt-8">
        <div className="flex flex-col gap-2 pb-4">
          <h2 className="typo-h2">{t('success')}</h2>
          <p className="typo-body-medium">
            {state.message || t('successDescription')}
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Underline variant="primary">
            <Link href="/login" className="text-primary">
              {t('login')}
            </Link>
          </Underline>
        </div>
      </Container>
    );
  }

  if (!hasValidLink) {
    return (
      <Container className="max-w-[500px] pt-8">
        <div className="flex flex-col gap-2 pb-4">
          <h2 className="typo-h2">{t('invalidLinkTitle')}</h2>
          <p className="typo-body-medium">{t('invalidLinkDescription')}</p>
        </div>

        <Underline variant="primary">
          <Link href="/reset" className="text-primary">
            {t('requestNewLink')}
          </Link>
        </Underline>
      </Container>
    );
  }

  return (
    <Container className="max-w-[500px] pt-8">
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="typo-h2">{t('title')}</h2>
        <p className="typo-body-medium">{t('description')}</p>
      </div>

      <div>
        <Form action={formAction} className="space-y-6" autoComplete="on">
          <input type="hidden" name="uid" value={uid} />
          <input type="hidden" name="timestamp" value={timestamp} />
          <input type="hidden" name="hash" value={hash} />

          {state.message && (
            <Alert variant="error" className="mb-4">
              {state.message}
            </Alert>
          )}

          <Field
            state={state}
            name="password"
            label={t('password')}
            required
            control={(props) => (
              <Input
                type="password"
                placeholder="••••••••••••••••••••"
                autoComplete="new-password"
                {...props}
              />
            )}
          />

          <Field
            state={state}
            name="passwordConfirm"
            label={t('passwordConfirm')}
            required
            control={(props) => (
              <Input
                type="password"
                placeholder="••••••••••••••••••••"
                autoComplete="new-password"
                {...props}
              />
            )}
          />

          <SubmitButton className="w-full" disabled={isPending}>
            {t('submit')}
          </SubmitButton>
        </Form>
      </div>
    </Container>
  );
}
