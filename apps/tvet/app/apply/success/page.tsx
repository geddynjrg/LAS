import { IconDownload, IconMail, IconPhone } from "@tabler/icons-react";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { Underline } from "@workspace/ui/components/underline";
import { cn } from "@workspace/ui/lib/utils";

const MOCK_SPONSORSHIPS = [
  {
    id: "1",
    name: "MPESA Foundation",
    description:
      "Eligibility is primarily for those who completed their KCSE and meet the placement criteria based on their exam results. Partially cover tuition fees.",
  },
  {
    id: "2",
    name: "Equity Foundation",
    description:
      "Applicants must demonstrate financial need, priority is often given to students from marginalised areas or with exceptional academic records.  Cover full tuition, accommodation, and learning materials.",
  },
  {
    id: "3",
    name: "Equity Foundation",
    description:
      "Bursaries do not need to be repaid and are awarded based on merit or financial background. Eligibility to Kenyan citizens, who have a valid admission letter to a registered VTC, and demonstrated financial need.",
  },
];

export default async function SuccessPage() {
  const sponsorships = MOCK_SPONSORSHIPS;

  return (
    <SectionWrap hasBottomPadding className={cn("space-y-7")}>
      <h2 className={cn("typo-h2")}>Thank you for applying!</h2>

      <div className={cn("space-y-5")}>
        <p>
          You should receive a confirmation on your phone that your application
          has been successfully submitted.
        </p>
        <p>
          Your application has been forwarded to Waithaka VTC is being processed
          and you will be notified through SMS about the next steps.
        </p>

        <div className={cn("space-y-1")}>
          <div className={cn("font-bold")}>Waithaka VTC Contacts</div>

          <Underline asChild>
            <a
              className={cn("flex items-center")}
              href="mailto:email@email.com"
            >
              <IconMail className="mr-2" />
              email@email.com
            </a>
          </Underline>

          <Underline asChild>
            <a className={cn("flex items-center")} href="tel:0000000000">
              <IconPhone /> +254 000 000000
            </a>
          </Underline>
        </div>
      </div>

      <div className={cn("flex w-full max-w-[27rem] flex-col gap-4")}>
        <Button asChild>
          <Link href="/dashboard">View my applications</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="#" download="Application">
            Download my application
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/">Back to front page</Link>
        </Button>
      </div>

      <h3
        className={cn(
          "typo-h3",
          "mt-12 border-b border-solid border-neutral-400 pb-3",
        )}
      >
        Available sponsorships for your course
      </h3>

      <div className={cn("flex flex-col gap-5")}>
        {sponsorships.length < 1 && (
          <h5 className={cn("typo-h5")}>
            No sponsorships available for your course
          </h5>
        )}

        {sponsorships.map((sponsorship) => (
          <Card
            className={cn(
              "border-none shadow-[var(--box-shadow-elevation-02)]",
            )}
            key={sponsorship.id}
            variant="success"
            title={<div className={cn("text-left")}>{sponsorship.name}</div>}
            caption={
              <div className={cn("text-left")}>{sponsorship.description}</div>
            }
          >
            <Underline asChild>
              <a className={cn("flex items-center gap-1")} href="#">
                <IconDownload />
                Download application form
              </a>
            </Underline>
          </Card>
        ))}
      </div>
    </SectionWrap>
  );
}
