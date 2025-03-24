import { useTranslations } from "next-intl";
import type { FC } from "react";

import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { SponsorshipCard } from "@workspace/ui/components/tvet/sponsorship-card";

export interface AvailableSponsorshipsProps {
  block_type: "available_sponsorships";
  sponsorships: {
    title: string;
    description: {
      value: string;
      format: string;
      processed: string;
    };
    id: string;
    link: {
      title: string;
      url: string;
      is_external: boolean;
    }[];
    application_form: {
      id: string;
      type: string;
      bundle: string;
      name: string;
      uuid: string;
      url: string;
      mime_type: string;
      size: number;
    };
  }[];
}

export const AvailableSponsorshipsBlock: FC<AvailableSponsorshipsProps> = ({
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
