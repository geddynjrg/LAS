import { TrainingCertificateActions } from '@/components/training-certificate-actions';
import { getTrainingCertificateStatus } from '@/lib/lms/training-certificate';
import { getTranslations } from 'next-intl/server';
import type { FC } from 'react';

interface TrainingCertificateDownloadProps {
  applicationId: string;
}

export const TrainingCertificateDownload: FC<
  TrainingCertificateDownloadProps
> = async ({ applicationId }) => {
  const t = await getTranslations('ApplicationDetailsPage');
  const status = await getTrainingCertificateStatus(applicationId);

  return (
    <TrainingCertificateActions
      applicationId={applicationId}
      status={status}
      downloadLabel={t('downloadTrainingCertificate')}
      availableFromLabel={
        status.eligibleFrom
          ? t('trainingCertificateAvailableFrom', {
              date: status.eligibleFrom,
            })
          : null
      }
    />
  );
};
