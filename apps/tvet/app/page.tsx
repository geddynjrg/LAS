import { IconChecklist, IconChevronDown } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@workspace/ui/components/button";

import { HeroSection } from "@/components/hero-section";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import { PageComponents } from "@/components/page-components";
import { ScrollTo } from "@/components/scroll-to";
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
            <ScrollTo targetId="content">
              <Button variant="secondary" className="px-6">
                <span>{t("learnMore")}</span>
                <IconChevronDown />
              </Button>
            </ScrollTo>
            <Button className="px-6">
              <span>{t("applyNow")}</span>
              <IconChecklist />
            </Button>
          </>
        }
      >
        <DescriptionBlock {...frontPage.data.content.body} />
      </HeroSection>
      <section id="content">
        <PageComponents
          page_components={frontPage.data?.content?.page_components ?? []}
        />
      </section>
    </div>
  );
}
