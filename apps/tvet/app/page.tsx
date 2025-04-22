import { IconChecklist, IconChevronDown } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { ScrollTo } from "@workspace/ui/components/scroll-to";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { HeroSection } from "@workspace/ui/components/tvet/hero-section";

import { PageComponents } from "@/components/page-components";
import { getLanding } from "@/lib/api/landing";

export default async function Page() {
  const t = await getTranslations("FrontPage");
  const pageData = await getLanding();

  const heroImage = Array.isArray(pageData?.data?.content?.image)
    ? pageData?.data?.content?.image.length > 0
      ? pageData?.data?.content?.image[0]
      : undefined
    : pageData?.data?.content?.image;

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title={pageData.data.title}
        backgroundUrl={heroImage?.url}
        backgroundAlt={heroImage?.alt}
        actions={
          <>
            <ScrollTo targetId="content">
              <Button variant="secondary" className="px-6">
                {t("learnMore")}
                <IconChevronDown />
              </Button>
            </ScrollTo>

            <Button className="px-6" asChild>
              <Link href="/apply">
                {t("applyNow")} <IconChecklist />
              </Link>
            </Button>
          </>
        }
      >
        <DescriptionBlock {...pageData.data.content.body} />
      </HeroSection>

      <section id="content">
        <PageComponents
          node_id={pageData.data.id}
          page_components={pageData.data?.content?.page_components ?? []}
        />
      </section>
    </div>
  );
}
