import { membersDataAction } from '@/app/apply/[id]/members/members-data-action';
import { MembersDataForm } from '@/app/apply/[id]/members/members-data-form';
import { getFormFieldOptions } from '@/lib/api/taxonomy.service';
import { getApplicationById } from '@/lib/data/application';
import { Container } from '@workspace/ui/components/container';
import { InfoPopover } from '@workspace/ui/components/uwezo/info-popover';
import { getTranslations } from 'next-intl/server';

export interface MembersPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: MembersPageProps) {
  const { id } = await params;
  const t = await getTranslations();

  // Fetch application and member type options in parallel
  const [application, memberTypeOptions] = await Promise.all([
    getApplicationById(id),
    getFormFieldOptions('memberType'),
  ]);

  return (
    <>
      <Container className="pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">{t('MembersPage.title')}</h2>
            <p>{t('MembersPage.subTitle')}</p>
          </div>
        </div>
      </Container>

      <InfoPopover />

      <MembersDataForm
        action={membersDataAction}
        id={id}
        applicationMembersData={application?.members}
        memberTypeOptions={memberTypeOptions}
      />
    </>
  );
}
