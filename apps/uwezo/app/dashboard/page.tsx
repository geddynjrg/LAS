import { IconChevronRight, IconMail, IconPhone } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { FC, PropsWithChildren } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { Currency } from "@workspace/ui/components/currency";
import { Underline } from "@workspace/ui/components/underline";

import {
  createApplication,
  getApplications,
  type Status,
} from "@/actions/application";
import { ApplicationStatus } from "@/components/ApplicationStatus";
import { auth } from "@/lib/auth";

export default async function Page() {
  const t = await getTranslations("DashboardPage");
  const data = await getApplications();
  const session = await auth();

  console.log(session);

  const handleCreateApplication = async () => {
    "use server";
    const application = await createApplication();

    console.log(application);
  };

  return (
    <Container>
      <div className="flex items-center gap-4 pb-6 pt-8">
        <h2 className="typo-h2">{t("myApplications")}</h2>

        {/* TODO: when data will come from API then replace this number */}
        <span className="typo-h6 text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full bg-neutral-500">
          {data.length}
        </span>
      </div>
      <div className="grid justify-center gap-8 pb-6 md:grid-cols-2 md:justify-normal">
        {data.map((data) => (
          <GroupDetails
            key={data.generalDetails.applicationId}
            applicationId={data.generalDetails.applicationId}
            groupName={data.groupDetails?.basicInfo.name}
            loanAmount={data.loanDetails?.amount}
            status={data.generalDetails.status}
          />
        ))}
      </div>
      <Button onClick={handleCreateApplication}>New</Button>
    </Container>
  );
}

interface GroupDetailsProps extends PropsWithChildren {
  applicationId: string;
  groupName?: string;
  loanAmount?: number;
  status: Status;
}

const GroupDetails: FC<GroupDetailsProps> = ({
  applicationId,
  groupName,
  loanAmount,
  status,
}) => {
  const t = useTranslations("DashboardPage");

  return (
    <div className="rounded-sm bg-neutral-100 px-4 py-8 shadow-md md:max-w-[500px]">
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
              status === "UNSUBMITTED" ? "#" : `/dashboard/${applicationId}`
            }
          >
            {status === "UNSUBMITTED"
              ? t("continueFillingApplication")
              : t("viewApplication")}
          </Link>
        </Button>
      </div>

      <div className="mt-4 border-t border-neutral-400 pt-4">
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
                    li: (chunk) => <li>{chunk}</li>,
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
            {status === "PENDING" && (
              <>
                <p>{t("stepDescription.pending")}</p>
                <Link href="#">
                  <Underline
                    variant="primary"
                    className="text-primary hover:cursor-pointer"
                  >
                    <p className="mt-4 flex items-center">
                      {t.rich("stepDescription.readMorePending", {
                        lineBreak: () => <br />,
                      })}
                      <IconChevronRight width={20} height={20} />
                    </p>
                  </Underline>
                </Link>
              </>
            )}
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
          {status === "PENDING" && <p>{t("processTimeline.pending")}</p>}
        </div>
      )}

      <div className="mt-4 grid gap-4 border-t border-neutral-400 py-4">
        <h2 className="typo-h5">{t("questions.title")}</h2>
        <Link href="mailto:mail@mail.com">
          <Underline variant="primary" className="text-primary gap-x-1">
            <IconMail />
            <p>email@email.com</p>
          </Underline>
        </Link>
        <Link href="tel:+254000000000">
          <Underline variant="primary" className="text-primary gap-x-1">
            <IconPhone />
            <p>+254 000 000000</p>
          </Underline>
        </Link>
      </div>
    </div>
  );
};
