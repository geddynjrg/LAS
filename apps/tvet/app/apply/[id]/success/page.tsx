import { IconMail, IconPhone } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { AvailableSponsorshipsBlock } from "@workspace/ui/components/tvet/blocks/available-sponsorships-block";
import { Underline } from "@workspace/ui/components/underline";
import { cn } from "@workspace/ui/lib/utils";

import {
  getApplicationProgress,
  getThankYouContent,
} from "@/lib/api/application";
import { getCourseNodeById } from "@/lib/api/node";

export interface SuccessPageProps {
  params: Promise<{ id: string }>;
}

type ApplicationStatus =
  | "draft"
  | "in_progress"
  | "submitted"
  | "application_payment_pending"
  | "application_payment_received"
  | "reviewing"
  | "rejected"
  | "approved"
  | "course_payment_pending"
  | "course_payment_received"
  | "completed";

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { id } = await params;
  const t = await getTranslations("ApplySuccessPage");

  const application = await getApplicationProgress({ id });

  const allowedStatuses: ApplicationStatus[] = [
    "application_payment_received",
    "reviewing",
    "course_payment_received",
    "completed",
    "submitted",
  ];

  if (!application?.status || !allowedStatuses.includes(application.status)) {
    notFound();
  }

  const courseId = application.steps_data?.course?.course;

  const course = courseId ? await getCourseNodeById(courseId) : null;
  const sponsorships = course?.data?.content.page_components.find(
    (component) => component.block_type === "available_sponsorships",
  );

  const data = await getThankYouContent(id);

  return (
    <Container className="mb-8 space-y-7">
      {data?.title && <h2 className="typo-h2">{data.title}</h2>}

      <div className="space-y-5">
        {data?.message && <p>{data?.message}</p>}
        {data?.institution_message && <p>{data?.institution_message}</p>}

        {data?.institution_contacts && (
          <div className="space-y-1">
            <div className="font-bold">
              {t("contacts", { institution: data?.institution_contacts.name })}
            </div>

            {data.institution_contacts.email && (
              <Underline asChild>
                <a
                  className={cn("flex items-center")}
                  href={`mailto:${data.institution_contacts.email}`}
                >
                  <IconMail className="mr-2" />
                  {data.institution_contacts.email}
                </a>
              </Underline>
            )}

            {data.institution_contacts.phone && (
              <Underline asChild>
                <a
                  className={cn("flex items-center")}
                  href={`tel:${data.institution_contacts.phone}`}
                >
                  <IconPhone /> {data.institution_contacts.phone}
                </a>
              </Underline>
            )}
          </div>
        )}
      </div>

      {data?.buttons && (
        <div className={cn("flex w-full max-w-[27rem] flex-col gap-4")}>
          {Object.entries(data.buttons).map(([key, button], index) => (
            <Button
              asChild
              key={key}
              variant={index === 0 ? "default" : "secondary"}
            >
              <Link
                href={button.url}
                target={button.url.startsWith("/api") ? "_blank" : undefined}
                rel={
                  button.url.startsWith("/api")
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {button.title}
              </Link>
            </Button>
          ))}
        </div>
      )}

      {sponsorships && (
        <>
          <h3
            className={cn(
              "typo-h3",
              "mt-12 border-b border-solid border-neutral-400 pb-3",
            )}
          >
            {t("sponsorshipsTitle")}
          </h3>

          <AvailableSponsorshipsBlock
            showHeading={false}
            className="p-0"
            {...sponsorships}
          />
        </>
      )}
    </Container>
  );
}
