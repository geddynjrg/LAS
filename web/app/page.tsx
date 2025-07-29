import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { Container } from "@workspace/ui/components/container";
import { Countup } from "@workspace/ui/components/countup";
import { IconCash } from "@workspace/ui/components/icon/icon-cash";
import { IconOkStar } from "@workspace/ui/components/icon/icon-ok-star";
import { IconProfile } from "@workspace/ui/components/icon/icon-profile";
import { IconStockGraph } from "@workspace/ui/components/icon/icon-stock-graph";
import { IconUsers } from "@workspace/ui/components/icon/icon-users";
import { LeadingSlash } from "@workspace/ui/components/leading-slash";
import { Card } from "@workspace/ui/components/uwezo/card";
import { HeroSection } from "@workspace/ui/components/uwezo/hero-section";
import { MetricCard } from "@workspace/ui/components/uwezo/metric-card";
import { NewsItem } from "@workspace/ui/components/uwezo/news-item";

import { ApplyButton } from "@/components/apply-button";
import { PageComponents } from "@/components/page-components";
import { getLanding } from "@/lib/api/landing";

const NEWS_ITEMS: {
  date: Date;
  imageUrl: string;
  title: string;
  category: string;
}[] = [
  {
    date: new Date(),
    imageUrl: "/news/news-1.jpeg",
    title: "National tree planting day",
    category: "Uwezo news & events",
  },
  {
    date: new Date(),
    imageUrl: "/news/news-2.jpeg",
    title: "National tree planting day",
    category: "Uwezo news & events",
  },
  {
    date: new Date(),
    imageUrl: "/news/news-3.jpeg",
    title: "National tree planting day",
    category: "Uwezo news & events",
  },
  {
    date: new Date(),
    imageUrl: "/news/news-1.jpeg",
    title: "National tree planting day",
    category: "Uwezo news & events",
  },
];

export default async function Page() {
  const t = await getTranslations("FrontPage");

  // Fetch landing page data
  let pageData;
  try {
    pageData = await getLanding();
  } catch (error) {
    console.error("Failed to fetch landing page data:", error);
    // Continue with static content if API fails
  }

  // Check if we have dynamic content from the API
  const hasDynamicContent =
    pageData?.data?.content?.page_components &&
    pageData.data.content.page_components.length > 0;

  return (
    <>
      {/* Render dynamic content if available */}
      {hasDynamicContent ? (
        <PageComponents
          node_id={pageData!.data.id?.toString()}
          page_components={pageData!.data.content.page_components}
        />
      ) : (
        /* Fallback to static content */
        <>
          <HeroSection
            title={t.rich("title", {
              title: (chunks: React.ReactNode) => <span className="typo-display">{chunks}</span>,
              light: (chunks: React.ReactNode) => <span className="font-light">{chunks}</span>,
              subTitle: (chunks: React.ReactNode) => <span className="typo-h4">{chunks}</span>,
              lineBreak: () => <br />,
            })}
            backgroundAlt={t("imageDescription")}
            actions={<ApplyButton />}
          >
            <span className="typo-body-large">
              {t.rich("description", {
                underline: (chunks: React.ReactNode) => (
                  <span className="underline">{chunks}</span>
                ),
              })}
            </span>
          </HeroSection>

          <StaticCriteriaSection />

          <div className="py-7.5 bg-primary lg:bg-transparent">
            <Container className="flex">
              <ApplyButton className="lg:hover:bg-primary mx-auto max-lg:flex-1 lg:basis-1/2" />
            </Container>
          </div>

          {/* <DescriptionSection />

          <AchievementsSection />

          <NewsSection /> */}
        </>
      )}
    </>
  );
}

// Create a server component version of CriteriaSection
async function StaticCriteriaSection() {
  const t = await getTranslations("FrontPage");

  return (
    <Container className="my-9" asChild>
      <section>
        <h1 className="typo-h3 mb-4">{t("criteria.title")}</h1>

        <div className="border-primary typo-body-medium grid gap-4 border-t pt-4 md:grid-cols-2">
          <div className="grid gap-4">
            <Card radius="lg" variant="primary">
              {t("criteria.one")}
            </Card>
            <Card radius="lg" variant="primary">
              {t("criteria.two")}
            </Card>
            <Card radius="lg" variant="primary">
              {t.rich("criteria.three", {
                bold: (chunks: React.ReactNode) => (
                  <>
                    <span className="font-bold">{chunks}</span>
                    <br />
                  </>
                ),
                ul: (chunks: React.ReactNode) => (
                  <ul className="typo-list-bullet ml-7">{chunks}</ul>
                ),
                li: (chunks: React.ReactNode) => <li>{chunks}</li>,
              })}
            </Card>
          </div>
          <div className="grid gap-4">
            <Card radius="lg" variant="primary">
              {t("criteria.four")}
            </Card>
            <Card radius="lg" variant="primary">
              {t("criteria.five")}
            </Card>
            <Card radius="lg" variant="primary">
              {t("criteria.six")}
            </Card>
          </div>
        </div>
      </section>
    </Container>
  );
}

// Keep the original client components for reference (not used in server component)
function CriteriaSection() {
  const t = useTranslations("FrontPage");

  return (
    <Container className="my-9" asChild>
      <section>
        <h1 className="typo-h3 mb-4">{t("criteria.title")}</h1>

        <div className="border-primary typo-body-medium grid gap-4 border-t pt-4 md:grid-cols-2">
          <div className="grid gap-4">
            <Card radius="lg" variant="primary">
              {t("criteria.one")}
            </Card>
            <Card radius="lg" variant="primary">
              {t("criteria.two")}
            </Card>
            <Card radius="lg" variant="primary">
              {t.rich("criteria.three", {
                bold: (chunks: React.ReactNode) => (
                  <>
                    <span className="font-bold">{chunks}</span>
                    <br />
                  </>
                ),
                ul: (chunks: React.ReactNode) => (
                  <ul className="typo-list-bullet ml-7">{chunks}</ul>
                ),
                li: (chunks: React.ReactNode) => <li>{chunks}</li>,
              })}
            </Card>
          </div>
          <div className="grid gap-4">
            <Card radius="lg" variant="primary">
              {t("criteria.four")}
            </Card>
            <Card radius="lg" variant="primary">
              {t("criteria.five")}
            </Card>
            <Card radius="lg" variant="primary">
              {t("criteria.six")}
            </Card>
          </div>
        </div>
      </section>
    </Container>
  );
}

function DescriptionSection() {
  const t = useTranslations("FrontPage");

  return (
    <Container className="pt-15 mb-4.5 gap-7.5 flex flex-col lg:flex-row">
      <section>
        <h2 className="mb-4">
          <LeadingSlash className="mb-1">
            {t("fundDescription.welcome")}
          </LeadingSlash>

          <div className="typo-h5">{t("fundDescription.title")}</div>
        </h2>

        <p className="typo-body-medium mb-5">
          {t("fundDescription.description")}
        </p>
        <p className="typo-body-medium mb-5">
          {t("fundDescription.objectives")}
        </p>
        <ul className="list-disc pl-8">
          <li>{t("fundDescription.objectivesList.one")}</li>
          <li>{t("fundDescription.objectivesList.two")}</li>
          <li>{t("fundDescription.objectivesList.three")}</li>
        </ul>
      </section>

      <section className="mx-auto flex flex-shrink-0 flex-col gap-3.5">
        <h2 className="typo-h6 border-theme-100 max-w-[250px] border-b-2 pb-3.5">
          Facebook
        </h2>

        <iframe
          className="max-w-full overflow-hidden"
          src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FTheUwezoFund&show_posts=true&lazy&width=500&height=400"
          width="500"
          height="400"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        ></iframe>
      </section>
    </Container>
  );
}

function AchievementsSection() {
  const t = useTranslations("FrontPage");

  return (
    <section className="bg-theme-100 mt-8">
      <Container className="grid gap-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="mb-8">
          <LeadingSlash>{t("achievements.successfulFunding")}</LeadingSlash>
          <h2 className="typo-h1-lg mt-2 leading-[2.8rem] lg:text-[2.1rem]">
            {t("achievements.title")}
          </h2>
        </div>

        <div className="space-y-5">
          <MetricCard
            title={t("achievements.womenGroup")}
            count={50842}
            icon={<IconProfile width={18} height={18} />}
          />
          <MetricCard
            title={t("achievements.youthGroup")}
            count={26409}
            icon={<IconUsers width={18} height={18} />}
          />
          <MetricCard
            title={t("achievements.pwdGroup")}
            count={2023}
            icon={<IconOkStar width={18} height={18} />}
          />
        </div>
        <div className="space-y-5">
          <MetricCard
            title={t("achievements.female")}
            count={789277}
            icon={<IconProfile width={18} height={18} />}
          />
          <MetricCard
            title={t("achievements.male")}
            count={337452}
            icon={<IconCash width={18} height={18} />}
          />
        </div>
        <div className="bg-theme-400 flex flex-col items-center justify-center self-start px-7 py-11">
          <IconStockGraph className="text-primary" width={70} height={70} />
          <h1 className="typo-h2 md:typo-h4">
            <Countup
              end={7230308489}
              decimal=","
              scrollSpyDelay={4}
              enableScrollSpy
              scrollSpyOnce
            />
          </h1>
          <p className="typo-body-small text-center">
            {t("achievements.cumulativeDisbursement")}
          </p>
        </div>
      </Container>
    </section>
  );
}

function NewsSection() {
  const t = useTranslations("FrontPage");

  return (
    <Container asChild>
      <section className="mt-8 flex flex-col items-center">
        <LeadingSlash className="mb-1">Uwezo</LeadingSlash>
        <h2 className="typo-h5 mb-9">{t("news.title")}</h2>

        <Carousel autoPlay={5000} className="max-w-full">
          <CarouselContent>
            {NEWS_ITEMS.map((newsItem, i) => (
              <CarouselItem
                key={i}
                className="basis-1/1 px-1 sm:basis-1/2 lg:basis-1/3"
              >
                <NewsItem
                  href="#"
                  date={newsItem.date}
                  imageUrl={newsItem.imageUrl}
                  title={newsItem.title}
                  linkTitle={newsItem.category}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselControls variant="uwezo" hideControls />
        </Carousel>
      </section>
    </Container>
  );
}
