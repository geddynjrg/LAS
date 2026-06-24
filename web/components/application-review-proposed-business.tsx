import type { ProposedBusinessData } from '@/lib/types/application.types';
import { IconPencil } from '@tabler/icons-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import { Currency } from '@workspace/ui/components/currency';
import { DataNode } from '@workspace/ui/components/data-node';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { type FC } from 'react';

export const ApplicationReviewProposedBusiness: FC<{
  businessDetails?: ProposedBusinessData;
  applicationId?: string;
}> = ({ businessDetails, applicationId }) => {
  const t = useTranslations('ApplicationDetailsPage');

  if (!businessDetails) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <div className="flex items-center justify-between pb-2">
        <h4 className="typo-h4">{t('proposedBusiness.proposedBusiness')}</h4>
        {applicationId && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/apply/${applicationId}/proposed-business`}>
              <IconPencil className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
        )}
      </div>
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="proposed-business-information">
          <AccordionTrigger>
            {t('proposedBusiness.businessInfo.businessInformation')}
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              <DataNode
                label={t('proposedBusiness.businessInfo.natureOfBusiness')}
              >
                {businessDetails.natureOfBusiness}
              </DataNode>
              <DataNode label={t('proposedBusiness.businessInfo.businessType')}>
                {Array.isArray(businessDetails.businessType) ? (
                  <div className="space-y-1">
                    {businessDetails.businessType.map((type, index) => (
                      <div key={index}>{type}</div>
                    ))}
                  </div>
                ) : (
                  businessDetails.businessType
                )}
              </DataNode>
              <DataNode
                label={t('proposedBusiness.businessInfo.operationPeriod')}
              >
                {t('numberYears', {
                  year: businessDetails.yearsInBusiness,
                })}
              </DataNode>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="proposed-business-performance">
          <AccordionTrigger>
            {t('proposedBusiness.businessPerformance.businessPerformance')}
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              <DataNode
                label={t(
                  'proposedBusiness.businessPerformance.averageIncomePerMonth',
                )}
              >
                <Currency
                  amount={businessDetails.averageIncome}
                  currency="KES"
                />
              </DataNode>
              <DataNode
                label={t('proposedBusiness.businessPerformance.costOfGoods')}
              >
                <Currency amount={businessDetails.costOfGoods} currency="KES" />
              </DataNode>
              <DataNode label={t('proposedBusiness.businessPerformance.rent')}>
                <Currency
                  amount={businessDetails.rentForBusiness}
                  currency="KES"
                />
              </DataNode>
              <DataNode
                label={t('proposedBusiness.businessPerformance.salaries')}
              >
                <Currency amount={businessDetails.salaries} currency="KES" />
              </DataNode>
              <DataNode
                label={t('proposedBusiness.businessPerformance.transportCosts')}
              >
                <Currency
                  amount={businessDetails.transportForBusinessStock}
                  currency="KES"
                />
              </DataNode>
              {businessDetails.customExpenses?.map((expense) => (
                <DataNode key={expense.name} label={expense.name}>
                  <Currency amount={expense.amount} currency="KES" />
                </DataNode>
              ))}
              <DataNode
                label={t('proposedBusiness.businessPerformance.netSurplus')}
              >
                <Currency
                  amount={
                    (businessDetails.averageIncome ?? 0) -
                    (businessDetails.costOfGoods ?? 0) -
                    (businessDetails.rentForBusiness ?? 0) -
                    (businessDetails.salaries ?? 0) -
                    (businessDetails.transportForBusinessStock ?? 0) -
                    (businessDetails.customExpenses?.reduce(
                      (sum, expense) => sum + expense.amount,
                      0,
                    ) ?? 0)
                  }
                  currency="KES"
                  signDisplay="always"
                />
              </DataNode>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
