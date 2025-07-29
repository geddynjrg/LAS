import {
  IconChevronRight,
  IconFileText,
  IconMail,
  IconPhone,
  IconPlus,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { FC, PropsWithChildren } from "react";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Container } from "@workspace/ui/components/container";
import { Currency } from "@workspace/ui/components/currency";
import { Underline } from "@workspace/ui/components/underline";

import { ApplicationStatus } from "@/components/application-status";
import type { SiteInformationResponse } from "@/lib/api/schema/site-info/site-info.schema";
import { getSiteInfo } from "@/lib/api/site-info";
import { type Status } from "@/lib/data/application";
import { getApplications } from "@/lib/data/application-db";

export default async function Page() {
  const t = await getTranslations("DashboardPage");
  const data = await getApplications();

  // Only fetch site info if we need it (no applications = empty state)
  let siteInfo: SiteInformationResponse | null = null;
  if (data.length === 0) {
    try {
      siteInfo = await getSiteInfo();
    } catch (error) {
      console.error("Failed to fetch site info:", error);
    }
  }

  return (
    <Container>
      <div className="flex items-center gap-4 pb-6 pt-8">
        <h2 className="typo-h2">{t("myApplications")}</h2>

        {/* TODO: when data will come from API then replace this number */}
        <span className="typo-h6 text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full bg-neutral-500">
          {data.length}
        </span>
      </div>

      {data.length === 0 ? (
        <EmptyApplicationsState siteInfo={siteInfo} />
      ) : (
        <div className="grid justify-center gap-8 pb-6 md:grid-cols-2 md:justify-normal">
          {data.map((application) => (
            <GroupDetails
              key={application.generalDetails.applicationId}
              applicationId={application.generalDetails.applicationId}
              groupName={application.groupData?.basics.groupName}
              loanAmount={application.loanConditions?.loanAmount}
              status={application.generalDetails.status}
              siteInfo={siteInfo}
            />
          ))}
        </div>
      )}
    </Container>
  );
}

interface EmptyApplicationsStateProps {
  siteInfo: SiteInformationResponse | null;
}

const EmptyApplicationsState: FC<EmptyApplicationsStateProps> = ({
  siteInfo,
}) => {
  const t = useTranslations("DashboardPage");

  // Fallback contact info (same as footer)
  const defaultContact = {
    phone: "+254 0776 154 215",
    email: "info@uwezo.go.ke",
  };

  const contact = siteInfo?.data?.site?.contact || defaultContact;

  return (
    <div className="mx-auto max-w-2xl">
      <Card variant="success" className="p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <IconFileText className="h-10 w-10 text-neutral-600" />
            </div>
          </div>

          {/* Heading */}
          <h3 className="typo-h2 mb-3 text-neutral-900">
            {t("emptyState.title")}
          </h3>

          {/* Description */}
          <p className="mb-8 text-neutral-600">{t("emptyState.description")}</p>

          {/* Apply Button */}
          <Button size="lg" className="mb-6 px-8" asChild>
            <Link href="/apply/create">
              <IconPlus className="mr-2 h-5 w-5" />
              {t("emptyState.applyButton")}
            </Link>
          </Button>

          {/* Additional Help */}
          <div className="border-t border-neutral-200 pt-6">
            <p className="mb-4 text-sm text-neutral-600">
              {t("emptyState.helpText")}
            </p>
            <div className="flex items-center justify-center gap-6">
              <Link href={`mailto:${contact.email}`}>
                <Underline
                  variant="primary"
                  className="flex items-center gap-x-2"
                >
                  <IconMail className="h-4 w-4" />
                  <span>{contact.email}</span>
                </Underline>
              </Link>
              <Link href={`tel:${contact.phone}`}>
                <Underline
                  variant="primary"
                  className="flex items-center gap-x-2"
                >
                  <IconPhone className="h-4 w-4" />
                  <span>{contact.phone}</span>
                </Underline>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface GroupDetailsProps extends PropsWithChildren {
  applicationId: string;
  groupName?: string;
  loanAmount?: number;
  status: Status;
  siteInfo: SiteInformationResponse | null;
}

const GroupDetails: FC<GroupDetailsProps> = ({
  applicationId,
  groupName,
  loanAmount,
  status,
  siteInfo,
}) => {
  const t = useTranslations("DashboardPage");

  // Fallback contact info (same as footer)
  const defaultContact = {
    phone: "+254 0776 154 215",
    email: "info@uwezo.go.ke",
  };

  const contact = siteInfo?.data?.site?.contact || defaultContact;

  return (
    <Card
      variant="success"
      className="rounded-sm bg-neutral-100 px-4 py-8 shadow-md md:max-w-[500px]"
    >
      <div>
        <div className="mb-4 grid gap-2">
          <h2 className="typo-h3">{applicationId}</h2>
          <div className="flex justify-between">
            <p>
              {t("group")} ”{groupName}”
            </p>
            {loanAmount && <Currency amount={loanAmount} currency="KES" />}
          </div>
        </div>
        <Button variant="secondary" className="w-full text-neutral-700" asChild>
          <Link
            href={
              status === "UNSUBMITTED" || status === "DRAFT"
                ? `/apply/${applicationId}/group-data`
                : `/dashboard/${applicationId}`
            }
          >
            {status === "UNSUBMITTED" || status === "DRAFT"
              ? t("continueFillingApplication")
              : t("viewApplication")}
          </Link>
        </Button>
      </div>

      <div className="mt-4 space-y-2 border-t border-neutral-400 pt-4">
        <p className="font-bold">{t("status.title")}</p>
        <ApplicationStatus status={status} />
      </div>

      {/* Step description block */}
      {status !== "UNSUBMITTED" && (
        <div className="mt-4 border-t border-neutral-400 pt-4">
          <h2 className="typo-h5">{t("stepDescription.title")}</h2>

          <div className="mt-4">
            {/* IN REVIEW */}
            {status === "IN_REVIEW" && (
              <>
                <ul className="list-disc pl-6">
                  {t.rich("stepDescription.inReview", {
                    li: (chunk: React.ReactNode) => <li>{chunk}</li>,
                  })}
                </ul>
                <Link href="#">
                  <Underline
                    variant="primary"
                    className="text-primary hover:cursor-pointer"
                  >
                    <p className="mt-4 flex items-center">
                      {t("stepDescription.readMoreInReview")}
                      <IconChevronRight width={20} height={20} />
                    </p>
                  </Underline>
                </Link>
              </>
            )}

            {/* PENDING */}
            {status === "PENDING" ||
              (status === "SUBMITTED" && (
                <>
                  <p>{t("stepDescription.pending")}</p>
                  <Link href="#">
                    <Underline
                      variant="primary"
                      className="text-primary hover:cursor-pointer"
                    >
                      <p className="mt-4 flex items-center gap-1">
                        {t.rich("stepDescription.readMorePending", {
                          lineBreak: () => <br />,
                        })}
                        <IconChevronRight width={20} height={20} />
                      </p>
                    </Underline>
                  </Link>
                </>
              ))}
          </div>
        </div>
      )}

      {/* Process timetable block */}
      {status !== "UNSUBMITTED" && (
        <div className="mt-4 grid gap-4 border-t border-neutral-400 py-4">
          <h2 className="typo-h5">{t("processTimeline.title")}</h2>

          {/* IN REVIEW */}
          {status === "IN_REVIEW" && <p>{t("processTimeline.inReview")}</p>}

          {/* PENDING */}
          {(status === "PENDING" || status === "SUBMITTED") && (
            <p>{t("processTimeline.pending")}</p>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 border-t border-neutral-400 py-4">
        <h2 className="typo-h5">{t("questions.title")}</h2>
        <Link href={`mailto:${contact.email}`}>
          <Underline variant="primary" className="text-primary gap-x-1">
            <IconMail />
            <p>{contact.email}</p>
          </Underline>
        </Link>
        <Link href={`tel:${contact.phone}`}>
          <Underline variant="primary" className="text-primary gap-x-1">
            <IconPhone />
            <p>{contact.phone}</p>
          </Underline>
        </Link>
      </div>
    </Card>
  );
};
