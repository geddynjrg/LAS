import type { LoanConditionsData } from '@/app/apply/[id]/loan-conditions/loan-conditions-schema';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import { Currency } from '@workspace/ui/components/currency';
import { DataNode } from '@workspace/ui/components/data-node';
import { IconPencil } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { FC } from 'react';

interface ApplicationReviewLoanConditionProps {
  loanConditionsData?: LoanConditionsData;
  applicationId?: string;
}

export const ApplicationReviewLoanConditions: FC<
  ApplicationReviewLoanConditionProps
> = ({ loanConditionsData, applicationId }) => {
  const t = useTranslations('ApplicationDetailsPage');

  if (!loanConditionsData) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <div className="flex items-center justify-between pb-2">
        <h4 className="typo-h4">{t('loan.loanConditions')}</h4>
        {applicationId && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/apply/${applicationId}/loan-conditions`}>
              <IconPencil className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
        )}
      </div>
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="loan-details">
          <AccordionTrigger>{t('loan.loanDetails')}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              <DataNode label={t('loan.loanType')}>
                {loanConditionsData.loanType}
              </DataNode>
              <DataNode label={t('loan.loanAmount')}>
                <Currency
                  amount={loanConditionsData.loanAmount}
                  currency="KES"
                />
              </DataNode>
              <DataNode label={t('loan.repaymentPeriod')}>
                {t('numberMonths', {
                  month: loanConditionsData.repaymentPeriod,
                })}
              </DataNode>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bank-account-details">
          <AccordionTrigger>{t('loan.bankAccountDetails')}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              <DataNode label={t('loan.groupsBankName')}>
                {loanConditionsData.bankNameOther &&
                loanConditionsData.bankName === 'Other'
                  ? loanConditionsData.bankNameOther
                  : loanConditionsData.bankName}
              </DataNode>
              <DataNode label={t('loan.groupsBankBranch')}>
                {loanConditionsData.bankBranch}
              </DataNode>
              <DataNode label={t('loan.bankAccountNumber')}>
                {loanConditionsData.accountNumber}
              </DataNode>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
