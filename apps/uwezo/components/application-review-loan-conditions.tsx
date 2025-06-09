import { useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Currency } from "@workspace/ui/components/currency";
import { DataNode } from "@workspace/ui/components/data-node";

import type { LoanConditionsData } from "@/app/apply/[id]/loan-conditions/loan-conditions-schema";

interface ApplicationReviewLoanConditionProps {
  loanConditionsData?: LoanConditionsData;
}

export const ApplicationReviewLoanConditions: FC<
  ApplicationReviewLoanConditionProps
> = ({ loanConditionsData }) => {
  const t = useTranslations("ApplicationDetailsPage");

  if (!loanConditionsData) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("loan.loanConditions")}</h4>
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="loan-details">
          <AccordionTrigger>{t("loan.loanDetails")}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              <DataNode label={t("loan.purposeOfTheLoan")}>
                {loanConditionsData.purposeOfLoan}
              </DataNode>
              <DataNode label={t("loan.loanType")}>
                {loanConditionsData.loanType}
              </DataNode>
              <DataNode label={t("loan.loanAmount")}>
                <Currency
                  amount={loanConditionsData.loanAmount}
                  currency="KES"
                />
              </DataNode>
              <DataNode label={t("loan.repaymentPeriod")}>
                {t("numberMonths", {
                  month: loanConditionsData.repaymentPeriod,
                })}
              </DataNode>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bank-account-details">
          <AccordionTrigger>{t("loan.bankAccountDetails")}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              <DataNode label={t("loan.groupsBankName")}>
                {loanConditionsData.bankNameOther &&
                loanConditionsData.bankName === "Other"
                  ? loanConditionsData.bankNameOther
                  : loanConditionsData.bankName}
              </DataNode>
              <DataNode label={t("loan.groupsBankBranch")}>
                {loanConditionsData.bankBranch}
              </DataNode>
              <DataNode label={t("loan.bankAccountNumber")}>
                {loanConditionsData.accountNumber}
              </DataNode>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
