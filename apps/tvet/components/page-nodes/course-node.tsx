import {
  IconArrowRight,
  IconChevronDown,
  IconMail,
  IconPhone,
} from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Tag } from "@workspace/ui/components/tag";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { Underline } from "@workspace/ui/components/underline";

import { HeroSection } from "@/components/hero-section";
import { PageComponents } from "@/components/page-components";
import { ScrollTo } from "@/components/scroll-to";
import type { CourseNodeType } from "@/lib/api/schema/node/course-node.schema";

export default async function CoursePageNode(pageData: CourseNodeType) {
  const t = await getTranslations("FrontPage");

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title={pageData?.data?.title}
        backgroundUrl={pageData?.data?.content?.image?.url}
        backgroundAlt={pageData?.data?.content?.image?.alt}
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

      <section className="bg-theme-100 px-4 pb-12 pt-8">
        <div className="app-container flex flex-col items-center">
          <Heading type="h3">Do you have questions?</Heading>
          <div className="mt-4 flex flex-col items-center gap-4">
            Get in contact with us and we’ll help you get the answers you need.
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
