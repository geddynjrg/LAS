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
import type { FC, PropsWithChildren, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Container } from "@workspace/ui/components/container";
import { Currency } from "@workspace/ui/components/currency";
import { Underline } from "@workspace/ui/components/underline";

import { ApplicationStatus } from "@/components/application-status";
import { MemberSummary } from "@/components/member-summary";
import type { SiteInformationResponse } from "@/lib/api/schema/site-info/site-info.schema";
import { getSiteInfo } from "@/lib/api/site-info";
import {
  type GeneralDetails,
  type MembersData,
  type Status,
} from "@/lib/data/application";
import { getHybridApplications } from "@/lib/data/applications-hybrid";

// Status configuration for dynamic content rendering
interface StatusConfig {
  showStepDescription: boolean;
  showProcessTimeline: boolean;
  stepDescription?: {
    key: string;
    hasReadMore?: boolean;
    readMoreKey?: string;
    richContent?: boolean;
  };
  processTimeline?: {
    key: string;
  };
}

const STATUS_CONFIGS: Record<Status, StatusConfig> = {
  UNSUBMITTED: {
    showStepDescription: false,
    showProcessTimeline: false,
  },
  DRAFT: {
    showStepDescription: false,
    showProcessTimeline: false,
  },
  SUBMITTED: {
    showStepDescription: true,
    showProcessTimeline: true,
    stepDescription: {
      key: "stepDescription.pending",
      hasReadMore: true,
      readMoreKey: "stepDescription.readMorePending",
    },
    processTimeline: {
      key: "processTimeline.pending",
    },
  },
  PENDING: {
    showStepDescription: true,
    showProcessTimeline: true,
    stepDescription: {
      key: "stepDescription.pending",
      hasReadMore: true,
      readMoreKey: "stepDescription.readMorePending",
    },
    processTimeline: {
      key: "processTimeline.pending",
    },
  },
  IN_REVIEW: {
    showStepDescription: true,
    showProcessTimeline: true,
    stepDescription: {
      key: "stepDescription.inReview",
      hasReadMore: true,
      readMoreKey: "stepDescription.readMoreInReview",
      richContent: true,
    },
    processTimeline: {
      key: "processTimeline.inReview",
    },
  },
  APPROVED: {
    showStepDescription: true,
    showProcessTimeline: false,
    stepDescription: {
      key: "stepDescription.approved",
    },
  },
  REJECTED: {
    showStepDescription: true,
    showProcessTimeline: false,
    stepDescription: {
      key: "stepDescription.rejected",
    },
  },
  DISBURSED: {
    showStepDescription: true,
    showProcessTimeline: false,
    stepDescription: {
      key: "stepDescription.disbursed",
    },
  },
  CLOSED: {
    showStepDescription: true,
    showProcessTimeline: false,
    stepDescription: {
      key: "stepDescription.closed",
    },
  },
};

// Helper component for rendering step descriptions
const StepDescriptionSection: FC<{
  config: StatusConfig;
  t: any;
}> = ({ config, t }) => {
  if (!config.showStepDescription || !config.stepDescription) {
    return null;
  }

  const { key, hasReadMore, readMoreKey, richContent } = config.stepDescription;

  return (
    <div className="mt-4 border-t border-neutral-400 pt-4">
      <h2 className="typo-h5">{t("stepDescription.title")}</h2>
      <div className="mt-4">
        {richContent ? (
          // For content that needs rich formatting (like lists)
          <ul className="list-disc pl-6">
            {t.rich(key, {
              li: (chunk: ReactNode) => <li>{chunk}</li>,
            })}
          </ul>
        ) : (
          // For simple text content
          <p>{t(key)}</p>
        )}

        {hasReadMore && readMoreKey && (
          <Link href="#">
            <Underline
              variant="primary"
              className="text-primary hover:cursor-pointer"
            >
              <p className="mt-4 flex items-center gap-1">
                {readMoreKey.includes("readMorePending")
                  ? t.rich(readMoreKey, {
                      lineBreak: () => <br />,
                    })
                  : t(readMoreKey)}
                <IconChevronRight width={20} height={20} />
              </p>
            </Underline>
          </Link>
        )}
      </div>
    </div>
  );
};

// Helper component for rendering process timeline
const ProcessTimelineSection: FC<{
  config: StatusConfig;
  t: any;
}> = ({ config, t }) => {
  if (!config.showProcessTimeline || !config.processTimeline) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-4 border-t border-neutral-400 py-4">
      <h2 className="typo-h5">{t("processTimeline.title")}</h2>
      <p>{t(config.processTimeline.key)}</p>
    </div>
  );
};

export default async function Page() {
  const t = await getTranslations("DashboardPage");
  // const data = await getApplications();
  const data = await getHybridApplications();

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
              members={application.members}
              rejectionDetails={application.generalDetails.rejectionDetails}
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
  members?: MembersData;
  rejectionDetails?: GeneralDetails["rejectionDetails"];
}

const GroupDetails: FC<GroupDetailsProps> = ({
  applicationId,
  groupName,
  loanAmount,
  status,
  siteInfo,
  members,
  rejectionDetails,
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
              {t("group")} &ldquo;{groupName}&rdquo;
            </p>
            {loanAmount && <Currency amount={loanAmount} currency="KES" />}
          </div>
        </div>

        {/* Member Status Summary */}
        {members && (
          <div className="mb-4 border-t border-neutral-400 pt-4">
            <MemberSummary
              membersData={members}
              variant="compact"
              showProgress={true}
            />
          </div>
        )}

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
        <ApplicationStatus
          status={status}
          rejectionDetails={rejectionDetails}
        />
      </div>

      {/* Dynamic Step Description and Process Timeline */}
      <StepDescriptionSection config={STATUS_CONFIGS[status]} t={t} />
      <ProcessTimelineSection config={STATUS_CONFIGS[status]} t={t} />

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
