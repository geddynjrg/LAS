import { IconChevronDown } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@workspace/ui/components/button";

import { HeroSection } from "@/components/hero-section";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import { PageComponents } from "@/components/page-components";
import { ScrollTo } from "@/components/scroll-to";
import type { GenericNodeType } from "@/lib/api/schema/node/generic-node.schema";

export default async function GenericPageNode(pageData: GenericNodeType) {
  const t = await getTranslations("InstitutionPage");

  return (
    <div className="flex flex-1 flex-col">
      {pageData.data?.title && pageData.data?.content.body && (
        <HeroSection
          title={pageData.data.title}
          backgroundUrl={pageData.data?.content?.image?.url}
          backgroundAlt={pageData.data?.content?.image?.alt}
          actions={
            <ScrollTo targetId="content">
              <Button variant="secondary">
                {t("learnMore")} <IconChevronDown />
              </Button>
            </ScrollTo>
          }
        >
          <DescriptionBlock {...pageData.data?.content.body} />
        </HeroSection>
      )}

      <section id="content">
        <PageComponents
          page_components={pageData.data?.content.page_components ?? []}
        />
      </section>
    </div>
  );
}
