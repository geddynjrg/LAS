'use client';

import { updateApplicationStatusById } from '@/app/apply/[id]/review/update-application-status-by-id-action';
import { ApplicationStatus } from '@/generated/prisma';
import { syncApplication } from '@/lib/api/sync.service';
import { IconArrowLeft } from '@tabler/icons-react';
import { ActionBar } from '@workspace/ui/components/action-bar';
import { Button } from '@workspace/ui/components/button';
import { ModalButton } from '@workspace/ui/components/modal-button';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { type FC } from 'react';

export interface ReviewDataProps {
  id: string;
}

export const ReviewFooter: FC<ReviewDataProps> = ({ id }) => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <ActionBar className="mt-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Button
          variant="secondary"
          type="button"
          onClick={() => router.push(`/apply/${id}/confirmations`)}
        >
          <IconArrowLeft />
          {t('Common.back')}
        </Button>
        <ModalButton
          onConfirm={async () => {
            // Update application status to group_member_confirmation
            // Members will be sent SMS confirmations, and when 75% confirm,
            // the backend will automatically transition to submitted and sync
            await updateApplicationStatusById(
              id,
              ApplicationStatus.GROUP_MEMBER_CONFIRMATION,
            );
            router.push(`/apply/${id}/done`);
          }}
          cancelTitle={t('Common.back')}
          confirmTitle={t('Common.submit')}
          modalText={t('ReviewPage.confirmationDescription')}
          modalTitle={t('ReviewPage.confirmationTitle')}
          cancelButtonProps={{ variant: 'secondary' }}
          contentProps={{ size: 'sm' }}
          titleUnderline
        >
          {t('Common.submit')}
        </ModalButton>
      </div>
    </ActionBar>
  );
};
