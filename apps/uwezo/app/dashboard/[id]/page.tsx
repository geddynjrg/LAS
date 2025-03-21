import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import type { FC } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { Currency } from "@workspace/ui/components/currency";
import { DataNode } from "@workspace/ui/components/data-node";

import {
  getApplicationById,
  type GroupData,
  type LoanConditionsData,
  type MembersData,
} from "@/actions/application";
import type { ProposedBusinessData } from "@/actions/apply-form/proposed-business-data-schema";
import { ApplicationStatus } from "@/components/application-status";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const t = await getTranslations("ApplicationDetailsPage");

  const { id } = await params;

  const data = await getApplicationById(id);

  if (!data) {
    return <div>{t("applicationNotFound")}</div>;
  }

  return (
    <Container className="pb-8">
      <Button
        variant="secondary"
        className="mt-4 text-neutral-700 max-md:w-full"
        asChild
      >
        <Link href={`/dashboard`}>
          <IconArrowLeft />
          {t("backToDashboard")}
        </Link>
      </Button>

      <div className="mt-6">
        <h2 className="typo-h2">{data.generalDetails.applicationId}</h2>
        <p className="font-bold">{t("status")}</p>
        <ApplicationStatus status={data.generalDetails.status} />
      </div>

      <LoanConditions loanConditionsData={data.loanConditions} />

      <Members groupDetails={data.members} />

      <GroupData groupDetails={data.groupData} />

      <ProposedBusiness businessDetails={data.proposedBusiness} />
    </Container>
  );
}

interface LoanConditionProps {
  loanConditionsData?: LoanConditionsData;
}

const LoanConditions: FC<LoanConditionProps> = ({ loanConditionsData }) => {
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
                {loanConditionsData.bankName}
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

const Members: FC<{ groupDetails?: MembersData }> = ({ groupDetails }) => {
  const t = useTranslations("ApplicationDetailsPage");

  if (!groupDetails?.members) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("members.members")}</h4>
      <Accordion collapsible type="single" className="space-y-2">
        <AccordionItem value="members">
          <AccordionTrigger>{t("members.members")}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              {groupDetails.members.map((member, index) => (
                <DataNode key={index} label={member.fullname ?? ""}>
                  {member.type}
                </DataNode>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const GroupData: FC<{ groupDetails?: GroupData }> = async ({
  groupDetails,
}) => {
  const t = await getTranslations("ApplicationDetailsPage");
  const format = await getFormatter();

  if (
    !groupDetails?.basics &&
    !groupDetails?.location &&
    !groupDetails?.background
  ) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("groupData.groupData")}</h4>
      <Accordion type="multiple" className="space-y-2">
        {groupDetails.basics && (
          <AccordionItem value="basics">
            <AccordionTrigger>
              {t("groupData.basicInfo.groupBasics")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode label={t("groupData.basicInfo.groupName")}>
                  {groupDetails.basics.groupName}
                </DataNode>
                <DataNode label={t("groupData.basicInfo.registrationNumber")}>
                  {groupDetails.basics.groupRegistrationNumber}
                </DataNode>
                <DataNode label={t("groupData.basicInfo.dateFormed")}>
                  {format.dateTime(groupDetails.basics.dateFormed, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                </DataNode>
                <DataNode
                  label={t("groupData.basicInfo.groupRegistrationCert")}
                >
                  {groupDetails.basics.groupRegistrationCertificate}
                </DataNode>
                <DataNode label={t("groupData.basicInfo.listOfMembersOnCert")}>
                  {groupDetails.basics.listOfMembersOnCertificate}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {groupDetails.location && (
          <AccordionItem value="location">
            <AccordionTrigger>
              {t("groupData.locationInfo.locationOfTheGroup")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode
                  label={t("groupData.locationInfo.countryOfOperation")}
                >
                  {groupDetails.location.countyOfOperation}
                </DataNode>
                <DataNode label={t("groupData.locationInfo.constituency")}>
                  {groupDetails.location.constituency}
                </DataNode>
                <DataNode label={t("groupData.locationInfo.ward")}>
                  {groupDetails.location.ward}
                </DataNode>
                <DataNode label={t("groupData.locationInfo.meetingPoint")}>
                  {groupDetails.location.meetingPoint}
                </DataNode>
                <DataNode label={t("groupData.locationInfo.nearestLandmark")}>
                  {groupDetails.location.nearestLandmark}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {groupDetails.background && (
          <AccordionItem value="background">
            <AccordionTrigger>
              {t("groupData.groupBackground.groupBackground")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode
                  label={t("groupData.groupBackground.purposeOfTheGroup")}
                >
                  {groupDetails.background.purposeOfTheGroup}
                </DataNode>
                <DataNode
                  label={t("groupData.groupBackground.keyActivitiesOfGroup")}
                >
                  {groupDetails.background.keyActivitiesOfTheGroup}
                </DataNode>
                <DataNode label={t("groupData.groupBackground.creditHistory")}>
                  {groupDetails.background.groupCreditHistory}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

const ProposedBusiness: FC<{
  businessDetails?: ProposedBusinessData;
}> = async ({ businessDetails }) => {
  const t = await getTranslations("ApplicationDetailsPage");
  const format = await getFormatter();

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
