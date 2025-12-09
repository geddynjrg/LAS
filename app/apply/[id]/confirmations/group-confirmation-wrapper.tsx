'use client';

import { confirmationDataAction } from '@/app/apply/[id]/confirmations/confirmation-data-action';
import { ConfirmationsDataForm } from '@/app/apply/[id]/confirmations/confirmations-data-form';
import type {
  ApplicationData,
  ConfirmationsData,
  MembersData,
} from '@/lib/types/application.types';
import { useRouter } from 'next/navigation';

export interface GroupConfirmationWrapperProps {
  id: string;
  applicationConfirmationData?: ConfirmationsData;
  members: MembersData;
  application: ApplicationData;
}

export default function GroupConfirmationWrapper({
  id,
  applicationConfirmationData,
  members,
  application,
}: GroupConfirmationWrapperProps) {
  const router = useRouter();

  return (
    <ConfirmationsDataForm
      id={id}
      action={confirmationDataAction}
      onSuccess={() => router.push(`/apply/${id}/review`)}
      declarationsData={applicationConfirmationData?.declarations}
    />
  );
}
