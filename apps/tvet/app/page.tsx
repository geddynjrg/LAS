import { IconChecklist, IconChevronDown } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@workspace/ui/components/button";

import { HeroSection } from "@/components/hero-section";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import { PageComponents } from "@/components/page-components";
import { getDashboardData } from "@/lib/api/dashboard";

export default async function Page() {
  const t = await getTranslations("FrontPage");
  const frontPage = await getDashboardData();

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title={frontPage.data.title}
        backgroundUrl={frontPage.data.content.image.url}
        backgroundAlt={t("imageDescription")}
        actions={
          <>
            <Button variant="secondary" className="px-6">
              Learn more <IconChevronDown />
            </Button>
            <Button className="px-6">
              Apply now <IconChecklist />
            </Button>
          </>
        }
      >
        <DescriptionBlock {...frontPage.data.content.body} />
      </HeroSection>

      <PageComponents
        page_components={frontPage.data?.content?.page_components ?? []}
      />
    </div>
  );
}
