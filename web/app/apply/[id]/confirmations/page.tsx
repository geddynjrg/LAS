import ConfirmationFormsWrapper from '@/app/apply/[id]/confirmations/confirmations-forms-wrapper';
import GroupConfirmationWrapper from '@/app/apply/[id]/confirmations/group-confirmation-wrapper';
import { getApplicationById } from '@/lib/data/application-db';
import { Container } from '@workspace/ui/components/container';
import { InfoPopover } from '@workspace/ui/components/uwezo/info-popover';
import { getTranslations } from 'next-intl/server';

export interface GroupDataPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: GroupDataPageProps) {
  const { id } = await params;
  const t = await getTranslations();
  const application = await getApplicationById(id);

  if (!application) {
    throw new Error('Application not found, this should not happen');
  }

  if (!application.members) {
    throw new Error('Members data not found, this should not  happen');
  }

  return (
    <>
      <Container className="pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">{t('ConfirmationsPage.title')}</h2>
          </div>
        </div>
      </Container>

      <InfoPopover />

      {/* <ConfirmationFormsWrapper
        id={id}
        application={application}
        applicationConfirmationData={application.confirmations}
        members={application.members}
      /> */}

      <GroupConfirmationWrapper
        id={id}
        application={application}
        applicationConfirmationData={application.confirmations}
        members={application.members}
      />
    </>
  );
}
