import { IconChevronDown, IconMail, IconPhone } from "@tabler/icons-react";
import { redirect } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import { Underline } from "@workspace/ui/components/underline";

import { Heading } from "@/components/heading";
import { HeroSection } from "@/components/hero-section";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import { PageComponents } from "@/components/page-components";
import { getInstitutionData } from "@/lib/api/institution";

interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<{ page?: string }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
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
          <Button variant="secondary">
            Learn more <IconChevronDown />
          </Button>
        }
      >
        {pageData.data?.content.body && (
          <DescriptionBlock {...pageData.data?.content.body} />
        )}
      </HeroSection>

      <PageComponents
        page_components={pageData.data?.content.page_components ?? []}
      />

      {/* <section className="bg-neutral-100 py-12">
        <Container>
          <Heading type="h2">Our social media</Heading>
          <div className="mt-4 flex flex-row items-center justify-between gap-4">
            <div className="flex w-full gap-4 border-r border-[#D6DAE4]">
              <img
                src="/waithaka-logo.png"
                alt="Waithaka logo"
                width={50}
                height={50}
              />
              <div className="flex flex-col justify-center gap-1">
                <div className="typo-body-large font-bold">Waithaka VTC</div>
                <div className="text-[#9CA0AC]">1345 Posts</div>
              </div>
            </div>
            <Button className="ml-4">Follow us</Button>
          </div>

          <Carousel autoPlay={5000} className="mt-4">
            <CarouselContent>
              {socialPosts.map((post, i) => (
                <CarouselItem
                  key={i}
                  className="lg:basis-2/7 aspect-square basis-2/3 px-1 sm:basis-2/5"
                >
                  <SocialMediaCard
                    imageUrl={post.imageUrl}
                    source={post.source}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselControls />
          </Carousel>
        </Container>
      </section> */}

      <section className="bg-theme-100 pb-12 pt-8">
        <div className="app-container flex flex-col items-center px-4">
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
