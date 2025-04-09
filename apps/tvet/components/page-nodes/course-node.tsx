import { IconArrowRight, IconChevronDown } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Tag } from "@workspace/ui/components/tag";
import { Underline } from "@workspace/ui/components/underline";

import { HeroSection } from "@/components/hero-section";
import { PageComponents } from "@/components/page-components";
import { ScrollTo } from "@/components/scroll-to";
import type { CourseNodeType } from "@/lib/api/schema/node/course-node.schema";

export default async function CoursePageNode(pageData: CourseNodeType) {
  const t = await getTranslations("FrontPage");

  const heroImage = Array.isArray(pageData?.data?.content?.image)
    ? pageData?.data?.content?.image.length > 0
      ? pageData?.data?.content?.image[0]
      : undefined
    : pageData?.data?.content?.image;

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title={pageData?.data?.title}
        backgroundUrl={heroImage?.url}
        backgroundAlt={heroImage?.alt}
        actions={
          <ScrollTo targetId="content">
            <Button variant="secondary" className="px-6">
              <span>{t("learnMore")}</span>
              <IconChevronDown />
            </Button>
          </ScrollTo>
        }
      >
        <div className="mt-4">
          <Underline asChild variant="white">
            <Link href={pageData.data?.content?.institution?.path_alias ?? "#"}>
              {pageData.data?.content?.institution?.title}
              <IconArrowRight />
            </Link>
          </Underline>
          <div className="mt-4 flex gap-2">
            {pageData.data?.content?.tags?.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
      </HeroSection>

      <section id="content">
        <PageComponents
          page_components={pageData.data?.content.page_components ?? []}
        />
      </section>
    </div>
  );
}
