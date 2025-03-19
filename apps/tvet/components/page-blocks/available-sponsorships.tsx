import type { FC, ReactNode } from "react";

import { SponsorshipCard } from "@workspace/ui/components/tvet/sponsorship-card";

import { Heading } from "@/components/heading";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { AvailableSponsorshipsBlockType } from "@/lib/api/types";

export interface AvailableSponsorshipsProps
  extends AvailableSponsorshipsBlockType {}

export const AvailableSponsorships: FC<AvailableSponsorshipsProps> = ({
  sponsorships,
}) => {
  return (
    <section className="py-10">
      <div className="app-container flex flex-col gap-4 px-4">
        <Heading type="h3">Available sponsorships</Heading>
        {sponsorships.map((sponsorship, key) => (
          <SponsorshipCard
            key={`sponsorship-${key}`}
            title={sponsorship.title}
            description={<DescriptionBlock {...sponsorship.description} />}
            applicationFormHref={sponsorship.application_form.url}
            websiteHref={sponsorship.link.at(0)?.url ?? ""}
          />
        ))}
      </div>
    </section>
  );
};
