import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { HeroSection } from "@workspace/ui/components/tvet/hero-section";

import { PageComponents } from "@/components/page-components";
import type { LandingNodeType } from "@/lib/api/schema/node/landing-node.schema";

export default async function LandingPageNode(pageData: LandingNodeType) {
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
      >
        {pageData.data.content.body && (
          <DescriptionBlock {...pageData.data.content.body} />
        )}
      </HeroSection>

      <section id="content">
        <PageComponents
          node_id={pageData.data.id}
          page_components={pageData.data?.content.page_components ?? []}
        />
      </section>
    </div>
  );
}
