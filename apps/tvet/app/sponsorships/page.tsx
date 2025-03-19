import { IconDownload, IconHandFinger, IconSend } from "@tabler/icons-react";
import { Suspense } from "react";

import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";
import { Pagination } from "@workspace/ui/components/pagination";
import { Select } from "@workspace/ui/components/select";
import { SponsorshipCard } from "@workspace/ui/components/tvet/sponsorship-card";

import { Heading } from "@/components/heading";
import { HeroSection } from "@/components/hero-section";
import { getSponsorships } from "@/lib/api/sponsorships";

export interface SponsorshipsPageProps {
  params: Promise<{ page?: number; take?: number }>;
}

export default async function SponsorshipsPage(_props: SponsorshipsPageProps) {
  const pageData = getSponsorships();

  const data = {
    page: 1,
    total: 46,
    take: 10,
    items: [
      {
        title: "MPESA Foundation",
        description:
          "Eligibility is primarily for those who completed their KCSE and meet the placement criteria based on their exam results. Partially cover tuition fees.",
        applicationForm: "/path/to/application-form",
        website: "/path/to/website",
      },
      {
        title: "Equity Foundation",
        description:
          "Applicants must demonstrate financial need, priority is often given to students from marginalized areas or with exceptional academic records. Cover full tuition, accommodation, and learning materials.",
        applicationForm: "/path/to/application-form",
        website: "/path/to/website",
      },
      {
        title: "HELB TVET Bursaries",
        description:
          "Bursaries do not need to be repaid and are awarded based on merit or financial background. Eligibility to Kenyan citizens, who have a valid admission letter to a registered VTC, and demonstrated financial need.",
        applicationForm: "/path/to/application-form",
      },
      {
        title: "Lorem ipsum",
        description:
          "Bursaries do not need to be repaid and are awarded based on merit or financial background. Eligibility to Kenyan citizens, who have a valid admission letter to a registered VTC, and demonstrated financial need.",
        applicationForm: "/path/to/application-form",
      },
      {
        title: "Lorem ipsum",
        description:
          "Bursaries do not need to be repaid and are awarded based on merit or financial background. Eligibility to Kenyan citizens, who have a valid admission letter to a registered VTC, and demonstrated financial need.",
        applicationForm: "/path/to/application-form",
      },
      {
        title: "Lorem ipsum",
        description:
          "Bursaries do not need to be repaid and are awarded based on merit or financial background. Eligibility to Kenyan citizens, who have a valid admission letter to a registered VTC, and demonstrated financial need.",
        applicationForm: "/path/to/application-form",
      },
      {
        title: "Lorem ipsum",
        description:
          "Bursaries do not need to be repaid and are awarded based on merit or financial background. Eligibility to Kenyan citizens, who have a valid admission letter to a registered VTC, and demonstrated financial need.",
        applicationForm: "/path/to/application-form",
      },
      {
        title: "Lorem ipsum",
        description:
          "Bursaries do not need to be repaid and are awarded based on merit or financial background. Eligibility to Kenyan citizens, who have a valid admission letter to a registered VTC, and demonstrated financial need.",
        applicationForm: "/path/to/application-form",
      },
      {
        title: "Lorem ipsum",
        description:
          "Bursaries do not need to be repaid and are awarded based on merit or financial background. Eligibility to Kenyan citizens, who have a valid admission letter to a registered VTC, and demonstrated financial need.",
        applicationForm: "/path/to/application-form",
      },
      {
        title: "Lorem ipsum",
        description:
          "Bursaries do not need to be repaid and are awarded based on merit or financial background. Eligibility to Kenyan citizens, who have a valid admission letter to a registered VTC, and demonstrated financial need.",
        applicationForm: "/path/to/application-form",
      },
    ],
  };

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title="Sponsorships"
        backgroundUrl="/hero-banners/banner-3.jpg"
        backgroundAlt="sponsorships"
      >
        Nairobi Vocational Training Centres (VTCs) offer a range of scholarship
        options aimed at helping students gain technical skills without
        financial burden.
      </HeroSection>

      <section className="bg-neutral-100 px-4 py-8">
        <div className="app-container">
          These scholarships are typically funded by both government programmes
          and private sector initiatives, such as the Kenya Universities and
          Colleges Central Placement Service (KUCCPS), Safaricom Foundation,
          and Higher Education Loans Board (HELB).
        </div>
      </section>
      <section className="app-container px-4 py-8">
        <h2 className="typo-h2">How to apply for a sponsorship</h2>
        <hr className="my-6" />
        <h3 className="typo-h5">To apply, you need to:</h3>
        <NumberedList variant="numbers" className="mt-1 gap-1">
          <NumberedListItem icon={<IconHandFinger />} className="gap-2">
            Choose a sponsorship that supports your chosen course. These can be
            seen on the course page.
          </NumberedListItem>
          <NumberedListItem icon={<IconDownload />} className="gap-2">
            Download the sponsorship form, read the instructions and fill it in.
          </NumberedListItem>
          <NumberedListItem icon={<IconSend />} className="gap-2">
            Send the form to the appropriate party as listed in the form.
          </NumberedListItem>
        </NumberedList>
        <hr className="my-6" />
        <p>
          If you require more information, some sponsorships have{" "}
          <strong>
            links to additional materials or websites that you can read.
          </strong>
          <br />
          <br />
          You can also contact the TVET you wish to apply to for more help and
          guidance.
        </p>
      </section>
      <div className="bg-neutral-100 py-8">
        <section className="app-container px-4">
          <Heading type="h2" className="typo-h2">
            Available sponsorships
          </Heading>
          <div>
            <div className="my-4 flex items-center justify-between">
              <div className="text-">
                Showing {`${data.page * data.take} of ${data.total}`} results
              </div>
              <div className="flex items-center gap-1">
                Show{" "}
                <Select
                  options={[
                    { label: "10", value: "10" },
                    { label: "20", value: "20" },
                    { label: "30", value: "30" },
                  ]}
                  className="w-21"
                  placeholder={data.take}
                />
              </div>
            </div>
          </div>
          <div>
            <Suspense fallback={<div>Loading...</div>}>
              <div
                id="sponsorship-list"
                className="grid grid-cols-1 gap-4 py-4"
              >
                {(data.items || []).map((sponsorship, index) => (
                  <SponsorshipCard
                    key={index}
                    title={sponsorship.title}
                    description={sponsorship.description}
                    applicationFormHref={sponsorship.applicationForm}
                    websiteHref={sponsorship.website}
                  />
                ))}
              </div>
            </Suspense>
          </div>
          <Pagination pageCount={10} />
        </section>
      </div>
    </div>
  );
}
