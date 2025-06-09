import { useTranslations } from "next-intl";
import { type FC } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Currency } from "@workspace/ui/components/currency";
import { DataNode } from "@workspace/ui/components/data-node";

import type { ProposedBusinessData } from "@/app/apply/[id]/proposed-business/proposed-business-data-schema";

export const ApplicationReviewProposedBusiness: FC<{
  businessDetails?: ProposedBusinessData;
}> = ({ businessDetails }) => {
  const t = useTranslations("ApplicationDetailsPage");

  if (!businessDetails) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("proposedBusiness.proposedBusiness")}</h4>
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="proposed-business-information">
          <AccordionTrigger>
            {t("proposedBusiness.businessInfo.businessInformation")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              <DataNode
                label={t("proposedBusiness.businessInfo.natureOfBusiness")}
              >
                {businessDetails.natureOfBusiness}
              </DataNode>
              <DataNode label={t("proposedBusiness.businessInfo.businessType")}>
                {businessDetails.businessType}
              </DataNode>
              <DataNode
                label={t("proposedBusiness.businessInfo.operationPeriod")}
              >
                {t("numberYears", {
                  year: businessDetails.yearsInBusiness,
                })}
              </DataNode>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="proposed-business-performance">
          <AccordionTrigger>
            {t("proposedBusiness.businessPerformance.businessPerformance")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              <DataNode
                label={t(
                  "proposedBusiness.businessPerformance.averageIncomePerMonth",
                )}
              >
                <Currency
                  amount={businessDetails.averageIncome}
                  currency="KES"
                />
              </DataNode>
              <DataNode
                label={t("proposedBusiness.businessPerformance.costOfGoods")}
              >
                <Currency amount={businessDetails.costOfGoods} currency="KES" />
              </DataNode>
              <DataNode label={t("proposedBusiness.businessPerformance.rent")}>
                <Currency
                  amount={businessDetails.rentForBusiness}
                  currency="KES"
                />
              </DataNode>
              <DataNode
                label={t("proposedBusiness.businessPerformance.salaries")}
              >
                <Currency amount={businessDetails.salaries} currency="KES" />
              </DataNode>
              <DataNode
                label={t("proposedBusiness.businessPerformance.transportCosts")}
              >
                <Currency
                  amount={businessDetails.transportForBusinessStock}
                  currency="KES"
                />
              </DataNode>
              <DataNode
                label={t("proposedBusiness.businessPerformance.netSurplus")}
              >
                <Currency
                  amount={
                    (businessDetails.averageIncome ?? 0) -
                    (businessDetails.costOfGoods ?? 0) -
                    (businessDetails.rentForBusiness ?? 0) -
                    (businessDetails.salaries ?? 0) -
                    (businessDetails.transportForBusinessStock ?? 0)
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
