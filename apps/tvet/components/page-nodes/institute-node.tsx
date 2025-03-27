import { IconChevronDown, IconMail, IconPhone } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@workspace/ui/components/button";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { Underline } from "@workspace/ui/components/underline";

import { HeroSection } from "@/components/hero-section";
import { PageComponents } from "@/components/page-components";
import { ScrollTo } from "@/components/scroll-to";
import type { InstitutionNodeType } from "@/lib/api/schema/node/institution-node.schema";

export default async function InstitutionPageNode(
  pageData: InstitutionNodeType,
) {
  const t = await getTranslations("InstitutionPage");

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
          <ScrollTo targetId="content">
            <Button variant="secondary">
              {t("learnMore")} <IconChevronDown />
            </Button>
          </ScrollTo>
        }
      >
        {pageData.data?.content.body && (
          <DescriptionBlock {...pageData.data?.content.body} />
        )}
      </HeroSection>

      <section id="content">
        <PageComponents
          page_components={pageData.data?.content.page_components ?? []}
        />
      </section>

      <section className="bg-theme-100 pb-12 pt-8">
        <div className="app-container flex flex-col items-center px-4">
          <Heading type="h3">{t("doYouHaveAnyQuestions")}</Heading>

          <div className="mt-4 flex flex-col items-center gap-4">
            {t("getInTouch")}
            <br />
            <Underline asChild>
              <a href="tel:+254 000 000000">
                <IconPhone /> +254 000 000000
              </a>
            </Underline>
            <Underline asChild>
              <a href="mailto:info@waithakavtc.ke">
                <IconMail className="mr-2" />
                info@waithakavtc.ke
              </a>
            </Underline>
          </div>
        </div>
      </section>
    </div>
  );
}
