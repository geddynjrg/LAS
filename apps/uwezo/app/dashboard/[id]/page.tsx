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
import { cn } from "@workspace/ui/lib/utils";

import {
  getApplicationById,
  type BankAccountDetails,
  type businessDetails,
  type GroupDetails,
  type LoanDetails,
} from "@/actions/application";
import { ApplicationStatus } from "@/components/ApplicationStatus";

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
        <h2 className="typo-h2">{data.applicationId}</h2>
        <p className="font-bold">{t("status")}</p>
        <ApplicationStatus status={data.status} />
      </div>

      <LoanConditions
        bankAccountDetails={data.bankAccountDetails}
        loanDetails={data.loanDetails}
      />

      <Members groupDetails={data.groupDetails} />

      <GroupData groupDetails={data.groupDetails} />

      <ProposedBusiness businessDetails={data.businessDetails} />
    </Container>
  );
}

interface LoanConditionProps {
  loanDetails?: LoanDetails;
  bankAccountDetails?: BankAccountDetails;
}

const LoanConditions: FC<LoanConditionProps> = ({
  bankAccountDetails,
  loanDetails,
}) => {
  const t = useTranslations("ApplicationDetailsPage");

  if (!loanDetails && !bankAccountDetails) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("loan.loanConditions")}</h4>
      <Accordion type="multiple" className="space-y-2">
        {loanDetails && (
          <AccordionItem value="loan-details">
            <AccordionTrigger>{t("loan.loanDetails")}</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode label={t("loan.purposeOfTheLoan")}>
                  {loanDetails.purpose}
                </DataNode>
                <DataNode label={t("loan.loanType")}>
                  {loanDetails.type}
                </DataNode>
                <DataNode label={t("loan.loanAmount")}>
                  <Currency amount={loanDetails.amount} currency="KES" />
                </DataNode>
                <DataNode label={t("loan.repaymentPeriod")}>
                  {t("numberMonths", {
                    month: loanDetails.repaymentPeriod,
                  })}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
        {bankAccountDetails && (
          <AccordionItem value="bank-account-details">
            <AccordionTrigger>{t("loan.bankAccountDetails")}</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode label={t("loan.groupsBankName")}>
                  {bankAccountDetails.bankName}
                </DataNode>
                <DataNode label={t("loan.groupsBankBranch")}>
                  {bankAccountDetails.groupsBankBranch}
                </DataNode>
                <DataNode label={t("loan.bankAccountNumber")}>
                  {bankAccountDetails.accountNumber}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

const Members: FC<{ groupDetails?: GroupDetails }> = ({ groupDetails }) => {
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
                <DataNode
                  key={index}
                  label={`${member.name} ${member.lastName}`}
                >
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

const GroupData: FC<{ groupDetails?: GroupDetails }> = async ({
  groupDetails,
}) => {
  const t = await getTranslations("ApplicationDetailsPage");
  const format = await getFormatter();

  if (
    !groupDetails?.basicInfo &&
    !groupDetails?.location &&
    !groupDetails?.background
  ) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("groupData.groupData")}</h4>
      <Accordion type="multiple" className="space-y-2">
        {groupDetails.basicInfo && (
          <AccordionItem value="basics">
            <AccordionTrigger>
              {t("groupData.basicInfo.groupBasics")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode label={t("groupData.basicInfo.groupName")}>
                  {groupDetails.basicInfo.name}
                </DataNode>
                <DataNode label={t("groupData.basicInfo.registrationNumber")}>
                  {groupDetails.basicInfo.registrationNumber}
                </DataNode>
                <DataNode label={t("groupData.basicInfo.dateFormed")}>
                  {format.dateTime(groupDetails.basicInfo.dateFormed, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                </DataNode>
                <DataNode
                  label={t("groupData.basicInfo.groupRegistrationCert")}
                >
                  {groupDetails.basicInfo.registrationCert}
                </DataNode>
                <DataNode label={t("groupData.basicInfo.listOfMembersOnCert")}>
                  {groupDetails.basicInfo.listOfMembersOnCert}
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
                  {groupDetails.location.countryOfOperation}
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
                  {groupDetails.background.purpose}
                </DataNode>
                <DataNode
                  label={t("groupData.groupBackground.keyActivitiesOfGroup")}
                >
                  {groupDetails.background.keyActivities}
                </DataNode>
                <DataNode label={t("groupData.groupBackground.creditHistory")}>
                  {groupDetails.background.creditHistory}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

const ProposedBusiness: FC<{ businessDetails?: businessDetails }> = async ({
  businessDetails,
}) => {
  const t = await getTranslations("ApplicationDetailsPage");
  const format = await getFormatter();

  if (!businessDetails?.information && !businessDetails?.performance) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("proposedBusiness.proposedBusiness")}</h4>
      <Accordion type="multiple" className="space-y-2">
        {businessDetails.information && (
          <AccordionItem value="proposed-business-information">
            <AccordionTrigger>
              {t("proposedBusiness.businessInfo.businessInformation")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode
                  label={t("proposedBusiness.businessInfo.natureOfBusiness")}
                >
                  {businessDetails.information.natureOfBusiness}
                </DataNode>
                <DataNode
                  label={t("proposedBusiness.businessInfo.businessType")}
                >
                  {businessDetails.information.type}
                </DataNode>
                <DataNode
                  label={t("proposedBusiness.businessInfo.operationPeriod")}
                >
                  {t("numberYears", {
                    year: businessDetails.information.operationPeriod,
                  })}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {businessDetails.performance && (
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
                    amount={businessDetails.performance.averageMonthIncome}
                    currency="KES"
                  />
                </DataNode>
                <DataNode
                  label={t("proposedBusiness.businessPerformance.costOfGoods")}
                >
                  <Currency
                    amount={businessDetails.performance.costOfGoodsPerMonth}
                    currency="KES"
                  />
                </DataNode>
                <DataNode
                  label={t("proposedBusiness.businessPerformance.rent")}
                >
                  <Currency
                    amount={businessDetails.performance.rent}
                    currency="KES"
                  />
                </DataNode>
                <DataNode
                  label={t("proposedBusiness.businessPerformance.salaries")}
                >
                  <Currency
                    amount={businessDetails.performance.salaries}
                    currency="KES"
                  />
                </DataNode>
                <DataNode
                  label={t(
                    "proposedBusiness.businessPerformance.transportCosts",
                  )}
                >
                  <Currency
                    amount={businessDetails.performance.transportCosts}
                    currency="KES"
                  />
                </DataNode>
                <DataNode
                  label={t("proposedBusiness.businessPerformance.netSurplus")}
                >
                  <Currency
                    amount={businessDetails.performance.netSurplus}
                    currency="KES"
                    signDisplay="always"
                  />
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};
