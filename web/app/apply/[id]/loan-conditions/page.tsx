import { loanConditionsAction } from '@/app/apply/[id]/loan-conditions/loan-conditions-action';
import { LoanConditionsDataForm } from '@/app/apply/[id]/loan-conditions/loan-conditions-data-form';
import { getFormFieldOptions } from '@/lib/api/taxonomy.service';
import { getApplicationById } from '@/lib/data/application';
import { Container } from '@workspace/ui/components/container';
import { InfoPopover } from '@workspace/ui/components/uwezo/info-popover';
import { getTranslations } from 'next-intl/server';

export interface LoanConditionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: LoanConditionsPageProps) {
  const { id } = await params;
  const t = await getTranslations();

  const [application, bankNameOptions, loanTypeOptions] = await Promise.all([
    getApplicationById(id),
    getFormFieldOptions('bankName'),
    getFormFieldOptions('loanType'),
  ]);

  const taxonomyOptions = {
    bankName: bankNameOptions,
    loanType: loanTypeOptions,
  };

  return (
    <>
      <Container className="pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">
              {t('ApplicationDetailsPage.loan.loanConditions')}
            </h2>
          </div>
        </div>
      </Container>

      <InfoPopover />
      <LoanConditionsDataForm
        action={loanConditionsAction}
        id={id}
        loanConditionsData={application?.loanConditions}
        taxonomyOptions={taxonomyOptions}
      />
    </>
  );
}
