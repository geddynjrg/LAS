import { getTrainingCertificateStatus } from '@/lib/lms/training-certificate';
import { IconDownload } from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
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

  if (!status.available) {
    if (!status.hasTrainingRecord || !status.eligibleFrom) {
      return null;
    }

    return (
      <p className="text-muted-foreground text-sm">
        {t('trainingCertificateAvailableFrom', {
          date: status.eligibleFrom,
        })}
      </p>
    );
  }

  return (
    <Button variant="secondary" className="w-full text-neutral-700" asChild>
      <a href={`/api/applications/${applicationId}/training-certificate`}>
        <IconDownload className="mr-2 size-4" />
        {t('downloadTrainingCertificate')}
      </a>
    </Button>
  );
};
