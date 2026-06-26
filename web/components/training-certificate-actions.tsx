import type { TrainingCertificateStatus } from '@/lib/lms/training-certificate';
import { IconDownload } from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
import type { FC } from 'react';

interface TrainingCertificateActionsProps {
  applicationId: string;
  status: TrainingCertificateStatus;
  downloadLabel: string;
  availableFromLabel?: string | null;
}

export const TrainingCertificateActions: FC<
  TrainingCertificateActionsProps
> = ({ applicationId, status, downloadLabel, availableFromLabel }) => {
  if (!status.available) {
    if (!status.hasTrainingRecord) {
      return null;
    }

    if (status.eligibleFrom && availableFromLabel) {
      return (
        <p className="text-muted-foreground text-sm">{availableFromLabel}</p>
      );
    }

    return null;
  }

  return (
    <Button variant="secondary" className="w-full text-neutral-700" asChild>
      <a href={`/api/applications/${applicationId}/training-certificate`}>
        <IconDownload className="mr-2 size-4" />
        {downloadLabel}
      </a>
    </Button>
  );
};
