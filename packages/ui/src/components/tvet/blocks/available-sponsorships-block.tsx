import { useTranslations } from "next-intl";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Pagination } from "@workspace/ui/components/pagination";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { SponsorshipCard } from "@workspace/ui/components/tvet/sponsorship-card";
import { cn } from "@workspace/ui/lib/utils";

export interface AvailableSponsorshipsProps {
  block_type: "available_sponsorships";
  sponsorships: {
    title: string;
    description: {
      value: string | null;
      format: string | null;
      processed: string | null;
    };
    id: string;
    link: {
      title: string;
      url: string;
      is_external?: boolean;
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
  pagination?: {
    current_page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export const AvailableSponsorshipsBlock: FC<AvailableSponsorshipsProps> = ({
  sponsorships,
  pagination,
}) => {
  const t = useTranslations("AvailableSponsorshipsBlock");
  return (
    <section className={cn("py-10")} id="sponsorships">
      <Container className="flex flex-col gap-4 px-4">
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
        {pagination && pagination.total_pages > 1 && (
          <Pagination
            pageCount={Math.round(pagination?.total_pages ?? 0)}
            navigationId="sponsorships"
          />
        )}
      </Container>
    </section>
  );
};
