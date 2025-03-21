import { useTranslations } from "next-intl";
import type { FC } from "react";

import { SponsorshipCard } from "@workspace/ui/components/tvet/sponsorship-card";

import { Heading } from "@/components/heading";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { AvailableSponsorshipsBlockType } from "@/lib/api/schema/block/available-sponsorships-block.schema";

export interface AvailableSponsorshipsProps
  extends AvailableSponsorshipsBlockType {}

export const AvailableSponsorships: FC<AvailableSponsorshipsProps> = ({
  sponsorships,
}) => {
  const t = useTranslations("AvailableSponsorshipsBlock");
  return (
    <section className="py-10">
      <div className="app-container flex flex-col gap-4 px-4">
        <Heading type="h3">{t("availableSponsorships")}</Heading>
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
