import { proposedBusinessAction } from '@/app/apply/[id]/proposed-business/proposed-business-action';
import { ProposedBusinessDataForm } from '@/app/apply/[id]/proposed-business/proposed-business-data-form';
import { getFormFieldOptions } from '@/lib/api/taxonomy.service';
import { getApplicationById } from '@/lib/data/application';
import { Container } from '@workspace/ui/components/container';
import { InfoPopover } from '@workspace/ui/components/uwezo/info-popover';
import { getTranslations } from 'next-intl/server';

export interface ProposedBusinessPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: ProposedBusinessPageProps) {
  const t = await getTranslations();
  const { id } = await params;

  const [application, businessTypeOptions] = await Promise.all([
    getApplicationById(id),
    getFormFieldOptions('businessType'),
  ]);

  const taxonomyOptions = {
    businessType: businessTypeOptions,
  };

  return (
    <>
      <Container className="pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">
              {t('ApplicationDetailsPage.proposedBusiness.proposedBusiness')}
            </h2>
          </div>
        </div>
      </Container>

      <InfoPopover />
      <ProposedBusinessDataForm
        action={proposedBusinessAction}
        id={id}
        applicationBusinessData={application?.proposedBusiness}
        taxonomyOptions={taxonomyOptions}
      />
    </>
  );
}
