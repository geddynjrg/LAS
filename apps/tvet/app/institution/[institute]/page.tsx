import {
  IconArrowGuide,
  IconChevronDown,
  IconMail,
  IconPhone,
  IconVideo,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { Button } from "@workspace/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { Container } from "@workspace/ui/components/container";
import { GalleryCarousel } from "@workspace/ui/components/gallery-carousel";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";
import { Underline } from "@workspace/ui/components/underline";

import { Heading } from "@/components/heading";
import { HeroSection } from "@/components/hero-section";
import { RoundedCard } from "@/components/rounded-card";

export default function Page() {
  const t = useTranslations("FrontPage");

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title="Waithaka Vocational Training Centre"
        backgroundUrl="/hero-banners/banner-2.jpg"
        backgroundAlt="Waithaka Vocational Training Centre is a fully accredited institution located in Nairobi, dedicated to equipping Kenyan youth with practical, industry-relevant skills for today's job market."
        actions={
          <Button variant="secondary">
            Learn more <IconChevronDown />
          </Button>
        }
      >
        {t("description")}
      </HeroSection>

      <section className="app-container bg-neutral-200 px-4 py-12">
        <div className="overflow-clip rounded-xl">
          <iframe
            src="https://www.youtube.com/embed/aaJbARH9eR8"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="aspect-video w-full"
          ></iframe>
        </div>
      </section>

      <section className="mt-4 bg-neutral-100 px-4 pb-12 pt-8">
        <div className="app-container">
          <Heading type="h2">Our courses</Heading>
          <p className="mt-4">
            The centre offers a variety of courses in key fields such as
            Plumbing, Welding, Electrical Engineering, and Food and Beverage
            Production.
          </p>
          <section className="mt-4 grid gap-4 xl:grid xl:grid-cols-3">
            <ApplyCard
              tags={["Electrical", "Tag 2"]}
              title="Electrical installation"
              fee="1500 KSh"
              school="Waithaka Vocational Training Centre"
              applyByDate="12.02.24"
              variant="secondary"
              href="/institution/1/course/2"
            />
            <ApplyCard
              tags={["Electrical", "Tag 2"]}
              title="Lorem ipsum dolor sit amet"
              fee="1500 KSh"
              school="Waithaka Vocational Training Centre"
              applyByDate="12.02.24"
              variant="secondary"
              href="/institution/1/course/2"
            />
            <ApplyCard
              tags={["Electrical", "Tag 2"]}
              title="Lorem ipsum dolor sit amet"
              fee="1500 KSh"
              school="Waithaka Vocational Training Centre"
              applyByDate="12.02.24"
              variant="secondary"
              href="/institution/1/course/2"
            />
            <ApplyCard
              tags={["Electrical", "Tag 2"]}
              title="Lorem ipsum dolor sit amet"
              fee="1500 KSh"
              school="Waithaka Vocational Training Centre"
              applyByDate="12.02.24"
              variant="secondary"
              href="/institution/1/course/2"
            />
            <ApplyCard
              tags={["Electrical", "Tag 2"]}
              title="Lorem ipsum dolor sit amet"
              fee="1500 KSh"
              school="Waithaka Vocational Training Centre"
              applyByDate="12.02.24"
              variant="secondary"
              href="/institution/1/course/2"
            />
          </section>
          <div className="flex justify-center lg:mt-8">
            <Button variant="secondary" className="max-w-3xs mt-4 w-full">
              Show all <IconChevronDown />
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-4 bg-neutral-200 pt-8">
        <div className="app-container">
          <div className="px-4">
            <Heading type="h2">Our facilities</Heading>
          </div>
          <section className="mt-4 flex flex-col lg:flex-row">
            <GalleryCarousel
              className="lg:flex-2"
              images={[
                {
                  url: "/classroom.jpg",
                  alt: "Facilities",
                },
                {
                  url: "/classroom2.jpg",
                  alt: "Facilities2",
                },
                {
                  url: "/classroom.jpg",
                  alt: "Facilities3",
                },
                {
                  url: "/classroom2.jpg",
                  alt: "Facilities4",
                },
              ]}
            />

            <RoundedCard className="relative -mt-4 lg:mt-0 lg:flex-1">
              <p>
                <strong>Recently refurbished with modern facilities</strong>{" "}
                through a KES 28 million investment by the Safaricom Foundation,
                the institution now boasts{" "}
                <strong>state-of-the-art ICT-enabled skills labs</strong> and
                <strong>cutting-edge equipment</strong> in its various
                departments.
                <br />
                <br />
                These improvements enhance the quality of training, ensuring
                that students gain{" "}
                <strong>
                  both practical skills and theoretical knowledge
                </strong>{" "}
                to excel in their chosen careers.
              </p>
            </RoundedCard>
          </section>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 bg-neutral-100 px-4 pb-12 pt-8">
        <div className="app-container grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RoundedCard className="text-primary-foreground rounded-tr-xl bg-[var(--color-primary)] bg-[url(/blend1.jpg)] bg-cover bg-bottom px-6 py-8 bg-blend-multiply">
            <p>
              <strong>
                At Waithaka, students benefit from a hands-on approach to
                learning
              </strong>
              , with 90% of training focused on{" "}
              <strong>practical skills</strong>. Industrial attachments and job
              placements are also a key feature of the programmes, helping
              students{" "}
              <strong>
                transition smoothly into employment or entrepreneurship
              </strong>{" "}
              upon completion.
            </p>
          </RoundedCard>
          <RoundedCard className="text-primary-foreground rounded-tr-xl bg-[#AD6A6C] bg-[url(/blend1.jpg)] bg-cover px-6 py-8 bg-blend-multiply">
            <p>
              <strong>The centre has seen high employability rates</strong>,
              with TVET graduates having a<strong>96% success rate</strong>in
              securing jobs compared to the lower rates seen among traditional
              university graduates.
            </p>
          </RoundedCard>
          <RoundedCard className="text-primary-foreground rounded-tr-xl bg-[#283044] bg-[url(/blend2.jpg)] bg-cover px-6 py-8 bg-blend-multiply">
            <p>
              <strong>
                With fully equipped facilities and highly qualified trainers
              </strong>
              , Waithaka Vocational Training Centre offers an{" "}
              <strong>ideal learning environment</strong> for those eager to
              pursue a skilled trade and secure a prosperous future
            </p>
          </RoundedCard>
        </div>
      </section>

      <Container asChild>
        <section className="mt-12 flex flex-col lg:flex-row lg:gap-4 lg:pb-16">
          <div className="flex flex-col justify-between lg:flex-1">
            <div className="px-4">
              <Heading type="h2">Location</Heading>
              <div className="grid grid-cols-2 items-center gap-2">
                <div className="typo-body-large">
                  <p className="font-bold">Address</p>
                  <p>79 David Osieli Rd, Nairobi, Kenya</p>
                </div>
                <Button variant="secondary" className="w-full">
                  Get directions <IconArrowGuide />
                </Button>
              </div>
            </div>
            <div>
              <p className="typo-body-large mt-4 px-4 font-bold">Our gates</p>
              <div className="relative mt-4 aspect-[16/9]">
                <Image
                  src="/our-gate.jpg"
                  alt="our gate"
                  style={{
                    objectFit: "cover",
                  }}
                  fill
                  quality={100}
                />
              </div>
            </div>
          </div>

          <div className="map relative box-border aspect-square w-full shrink bg-neutral-100 lg:flex-1">
            <Image
              src="/map.jpg"
              alt="map"
              fill
              style={{
                objectFit: "cover",
                objectPosition: "center",
              }}
              quality={100}
            />
          </div>
        </section>
      </Container>

      <section className="bg-neutral-100 py-12">
        <div className="app-container max-w-3xl">
          <Heading type="h2">Our social media</Heading>
          <div className="mt-4 flex flex-row items-center justify-between gap-4">
            <div className="flex w-full gap-4 border-r border-[#D6DAE4]">
              <Image
                src="/waithaka-logo.png"
                alt="Waithaka logo"
                width={50}
                height={50}
                quality={100}
              />
              <div className="flex flex-col justify-center gap-1">
                <div className="typo-body-large font-bold">Waithaka VTC</div>
                <div className="text-[#9CA0AC]">1345 Posts</div>
              </div>
            </div>
            <Button className="pl-4">Follow us</Button>
          </div>
          <Carousel className="mt-4">
            <CarouselContent className="w-4/5 gap-4 px-4">
              <CarouselItem className="relative aspect-square w-full overflow-clip rounded-xl">
                <Image
                  src="/classroom.jpg"
                  alt="Students in a classroom"
                  fill
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                  quality={100}
                />
                <div className="absolute bottom-4 left-4">
                  <Image
                    src="/icons/tiktok.svg"
                    alt="facebook"
                    width={32}
                    height={32}
                  />
                </div>
                <div className="absolute right-4 top-4">
                  <IconVideo className="text-primary-foreground size-8" />
                </div>
              </CarouselItem>
              <CarouselItem className="relative aspect-square w-full overflow-clip rounded-xl">
                <Image
                  src="/classroom.jpg"
                  alt="Students in a classroom"
                  fill
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                  quality={100}
                />

                <div className="absolute bottom-4 left-4">
                  <Image
                    src="/icons/facebook.svg"
                    alt="facebook"
                    width={32}
                    height={32}
                  />
                </div>
                <div className="absolute right-4 top-4">
                  <IconVideo className="text-primary-foreground size-8" />
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselControls />
          </Carousel>
        </div>
      </section>
      <section className="flex flex-col items-center bg-neutral-200 pb-8 pt-6">
        <div className="typo-h5">Follow us!</div>
        <div className="mt-5 flex gap-4">
          <Image
            src="/icons/facebook.svg"
            alt="facebook"
            width={32}
            height={32}
          />
          <Image
            src="/icons/tiktok.svg"
            alt="facebook"
            width={32}
            height={32}
          />
          <Image
            src="/icons/instagram.svg"
            alt="facebook"
            width={32}
            height={32}
          />
          <Image src="/icons/x.svg" alt="facebook" width={32} height={32} />
        </div>
      </section>

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
