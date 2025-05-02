import { IconMail, IconPhone } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { AvailableSponsorshipsBlock } from "@workspace/ui/components/tvet/blocks/available-sponsorships-block";
import { Underline } from "@workspace/ui/components/underline";
import { cn } from "@workspace/ui/lib/utils";

import { getApplicationProgress } from "@/lib/api/application";
import { getCourseNodeById } from "@/lib/api/node";

export interface SuccessPageProps {
  params: Promise<{ id: string }>;
}

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { id } = await params;

  const application = await getApplicationProgress({ id });

  if (!application || application.status !== "submitted") {
    notFound();
  }

  const courseId = application.steps_data?.course?.course;

  const course = courseId ? await getCourseNodeById(courseId) : null;
  const institution = course?.data?.content.institution;
  const sponsorships = course?.data?.content.page_components.find(
    (component) => component.block_type === "available_sponsorships",
  );
  const contact = course?.data?.content.page_components.find(
    (component) => component.block_type === "contact",
  );

  return (
    <Container className="mb-8 space-y-7">
      <h2 className="typo-h2">Thank you for applying!</h2>

      <div className="space-y-5">
        <p>
          You should receive a confirmation on your phone that your application
          has been successfully submitted.
        </p>
        <p>
          Your application has been forwarded to {institution?.title} is being
          processed and you will be notified through SMS about the next steps.
        </p>

        {contact && (
          <div className="space-y-1">
            <div className="font-bold">{institution?.title} Contacts</div>

            {contact.email && (
              <Underline asChild>
                <a
                  className={cn("flex items-center")}
                  href={`mailto:${contact.email}`}
                >
                  <IconMail className="mr-2" />
                  {contact.email}
                </a>
              </Underline>
            )}

            {contact.phone && (
              <Underline asChild>
                <a
                  className={cn("flex items-center")}
                  href={`tel:${contact.phone}`}
                >
                  <IconPhone /> {contact.phone}
                </a>
              </Underline>
            )}
          </div>
        )}
      </div>

      <div className={cn("flex w-full max-w-[27rem] flex-col gap-4")}>
        <Button asChild>
          <Link href="/dashboard">View my applications</Link>
        </Button>
        <Button variant="secondary" asChild>
          <a href="payment-info-pdf" target="_blank" rel="noopener noreferrer">
            Download my application
          </a>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/">Back to front page</Link>
        </Button>
      </div>

      {sponsorships && (
        <>
          <h3
            className={cn(
              "typo-h3",
              "mt-12 border-b border-solid border-neutral-400 pb-3",
            )}
          >
            Available sponsorships for your course
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
