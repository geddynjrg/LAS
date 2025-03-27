import { getTranslations } from "next-intl/server";

import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";

import { HeroSection } from "@/components/hero-section";
import { PageComponents } from "@/components/page-components";
import type { LandingNodeType } from "@/lib/api/schema/node/landing-node.schema";

export default async function LandingPageNode(pageData: LandingNodeType) {
  const t = await getTranslations("FrontPage");

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title={pageData.data.title}
        backgroundUrl={pageData.data.content.image?.url}
        backgroundAlt={pageData.data.title}
        // actions={
        //   <>
        //     <ScrollTo targetId="content">
        //       <Button variant="secondary" className="px-6">
        //         {t("learnMore")}
        //         <IconChevronDown />
        //       </Button>
        //     </ScrollTo>

        //     <Button className="px-6" asChild>
        //       <Link href="/apply">
        //         {t("applyNow")} <IconChecklist />
        //       </Link>
        //     </Button>
        //   </>
        // }
      >
        {pageData.data.content.body && (
          <DescriptionBlock {...pageData.data.content.body} />
        )}
      </HeroSection>

      <section id="content">
        <PageComponents
          page_components={pageData.data?.content.page_components ?? []}
        />
      </section>
    </div>
  );
}
