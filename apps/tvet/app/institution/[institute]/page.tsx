import { IconChevronDown, IconMail, IconPhone } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import { Underline } from "@workspace/ui/components/underline";

import { Heading } from "@/components/heading";
import { HeroSection } from "@/components/hero-section";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import { PageComponents } from "@/components/page-components";
import { ScrollTo } from "@/components/scroll-to";
import { getInstitutionData } from "@/lib/api/institution";

interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<{ page?: string }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const t = await getTranslations("InstitutionPage");
  const pageData = await getInstitutionData(params.institute ?? "");

  if (!pageData?.data) {
    throw Error("No data found");
  }

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title={pageData.data.title}
        backgroundUrl={pageData.data?.content.image.url}
        backgroundAlt={pageData.data?.content.image.alt}
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
