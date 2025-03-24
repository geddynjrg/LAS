import { IconChecklist, IconChevronDown } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";

import { HeroSection } from "@/components/hero-section";
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
        backgroundAlt={frontPage.data.title}
        actions={
          <>
            <ScrollTo targetId="content">
              <Button variant="secondary" className="px-6">
                {t("learnMore")}
                <IconChevronDown />
              </Button>
            </ScrollTo>

            <Button className="px-6" asChild>
              <Link href="/login/phone?callbackUrl=/apply">
                {t("applyNow")} <IconChecklist />
              </Link>
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
