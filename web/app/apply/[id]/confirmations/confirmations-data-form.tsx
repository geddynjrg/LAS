'use client';

import { ApplyFormActionBar } from '@/app/apply/[id]/apply-form-action-bar';
import {
  type ConfirmationData,
  confirmationDataSchema,
} from '@/app/apply/[id]/confirmations/confirmation-data-schema';
import type { DeclarationsData } from '@/lib/types/application.types';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Container } from '@workspace/ui/components/container';
import { Field, Form } from '@workspace/ui/components/form';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import { type FC, useEffect } from 'react';

export interface ConfirmationsDataProps {
  id: string;
  action: FormAction<ConfirmationData>;
  onSuccess: () => void;
  declarationsData?: DeclarationsData;
}

export const ConfirmationsDataForm: FC<ConfirmationsDataProps> = ({
  id,
  action,
  onSuccess,
  declarationsData,
}) => {
  const t = useTranslations();
  const [state, formAction, isPending] = useForm(
    action,
    confirmationDataSchema,
    {
      correctInformationConfirm:
        declarationsData?.correctInformationConfirm ?? undefined,
      fundsEligibleConfirm: declarationsData?.fundsEligibleConfirm ?? undefined,
      liabilityConfirm: declarationsData?.liabilityConfirm ?? undefined,
      membersConfirm: declarationsData?.membersConfirm ?? undefined,
    },
  );

  const prevUrl = `/apply/${id}/proposed-business`;

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <Form
      action={formAction}
      autoComplete="on"
      className={cn('grow-1 flex flex-col justify-between')}
    >
      <Container className={cn('space-y-8')}>
        <FormCard
          title={t('ConfirmationsPage.form-title-declarations')}
          className="space-y-4"
        >
          <Field
            state={state}
            name="membersConfirm"
            required
            control={(props) => (
              <Checkbox {...props}>
                {t('ConfirmationsPage.confirmationDataForm.group-member')}
              </Checkbox>
            )}
          />
          <Field
            state={state}
            name="correctInformationConfirm"
            required
            control={(props) => (
              <Checkbox {...props}>
                {t(
                  'ConfirmationsPage.confirmationDataForm.declare-true-information',
                )}
              </Checkbox>
            )}
          />
          <Field
            state={state}
            name="liabilityConfirm"
            required
            control={(props) => (
              <Checkbox {...props}>
                {t('ConfirmationsPage.confirmationDataForm.agree-to-repayment')}
              </Checkbox>
            )}
          />
          <Field
            state={state}
            name="fundsEligibleConfirm"
            required
            control={(props) => (
              <Checkbox {...props}>
                {t(
                  'ConfirmationsPage.confirmationDataForm.no-additional-loans',
                )}
              </Checkbox>
            )}
          />
        </FormCard>
      </Container>

      <input type="hidden" name="id" value={id} />

      <ApplyFormActionBar disabled={isPending} prevUrl={prevUrl} />
    </Form>
  );
};
