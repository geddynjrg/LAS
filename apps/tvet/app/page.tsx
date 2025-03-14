import {
  IconArrowRight,
  IconChecklist,
  IconChevronDown,
  IconSearch,
  IconTimeline,
  IconTools,
  IconZoomMoney,
} from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";
import { FeatureSection } from "@workspace/ui/components/tvet/feature-section";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import {
  RoundedCornerSection,
  RoundedCornerSectionHeader,
} from "@workspace/ui/components/tvet/rounded-corner-section";
import { SectionHeader } from "@workspace/ui/components/tvet/section-header";
import { TrainingAreaCard } from "@workspace/ui/components/tvet/training-area-card";
import { Underline } from "@workspace/ui/components/underline";

import { GradientCornerCard } from "@/components/gradient-corner-card";
import { Heading } from "@/components/heading";
import { HeroSection } from "@/components/hero-section";
import { LocationMap } from "@/components/location-map";
import { PageComponents } from "@/components/page-components";
import { getDashboardData } from "@/lib/api/dashboard";

export default async function Page() {
  const t = await getTranslations("FrontPage");
  const frontPage = await getDashboardData();

  console.log("data", frontPage);

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection
        title={t.rich("title", {
          light: (chunks) => <span className="block font-light">{chunks}</span>,
        })}
        backgroundUrl="/hero-banners/banner-1.jpg"
        backgroundAlt={t("imageDescription")}
        actions={
          <>
            <Button variant="secondary" className="px-6">
              Learn more <IconChevronDown />
            </Button>
            <Button className="px-6">
              Apply now <IconChecklist />
            </Button>
          </>
        }
      >
        {t("description")}
      </HeroSection>

      <PageComponents components={frontPage.content.page_components} />

      <Container>
        <section className="mt-4">
          <h2 className="typo-h5">Intake periods</h2>
          <p className="mt-2">
            Nairobi VTCs have <strong>three main intakes per year</strong>:
          </p>
          <ul className="list-inside list-disc">
            <li>January intake</li>
            <li>May intake</li>
            <li>September intake</li>
          </ul>
          <p className="mt-5">
            Most centres also offer <strong>rolling admissions</strong> for
            short courses, meaning students can{" "}
            <strong>join throughout the year</strong> based on course
            availability.
          </p>
        </section>
      </Container>

      <Container className="px-0">
        <SectionHeader
          title=" Unlock Your Future with TVET Training"
          image={{
            url: "/hero-banners/banner-1.jpg",
            alt: "Students in a classroom",
          }}
          subtitle="Looking for a path to success?"
        >
          <p className="font-bold">Looking for a path to success?</p>
          TVET (Technical and Vocational Education and Training) gives you the
          skills you need to build a career and take control of your future.
          Whether you want to become an electrician, chef, hairdresser, or
          entrepreneur, TVET equips you with hands-on training that prepares you
          for real jobs.
        </SectionHeader>
      </Container>

      <FeatureSection
        className="bg-background lg:mt-8"
        features={[
          {
            title: "Hands-on Training",
            text: "TVET gives you practical skills that you can apply in the workplace.",
            icon: <IconTools />,
          },
          {
            title: "In-demand Careers",
            text: "TVET connects you directly with industries looking for trained professionals.",
            icon: <IconTimeline />,
          },
          {
            title: "Affordable & Accessible",
            text: "With TVET, you get high-quality training that’s affordable and available near you.",
            icon: <IconZoomMoney />,
          },
        ]}
      >
        No matter your background, TVET will give you the{" "}
        <strong>tools to succeed and grow.</strong> Start your journey today and{" "}
        <strong>be part of Kenya’s future!</strong>
      </FeatureSection>

      <Container className="mt-4 flex flex-col gap-2 px-4 py-10 lg:gap-4">
        <Heading type="h2">Get sponsored to train</Heading>
        <p>
          Nairobi TVETs offer sponsorships from the government, NGOs, and
          private organizations to help students, especially those from
          underprivileged backgrounds, access vocational training in various
          fields.
        </p>

        <Underline asChild>
          <Link href="/sponsorship">
            Learn more about sponsorships <IconArrowRight />
          </Link>
        </Underline>
      </Container>

      <section className="bg-background mt-4 pb-12 pt-8">
        <Container className="flex flex-col items-center gap-4">
          <Heading type="h2" className="w-full">
            Apply now
          </Heading>
          <div className="flex w-full flex-col items-center gap-4 rounded-md bg-[#ccc9c0] px-4 py-8">
            <h2 className="typo-h4 self-start">Search for courses</h2>
            <div className="bg-background flex w-full justify-between gap-4 rounded-md p-2 text-[#686B78]">
              Search for courses
              <IconSearch />
            </div>
          </div>
          <section className="grid w-full gap-4 xl:grid xl:grid-cols-3">
            <ApplyCard
              tags={["Electrical", "Tag 2"]}
              title="Electrical installation"
              fee="1500 KSh"
              school="Waithaka Vocational Training Centre"
              applyByDate="12.02.24"
              startsOnDate="12.02.24"
              borderColor="#588157"
              href="#"
            />
            <ApplyCard
              tags={["Beauty", "Hairdressing"]}
              title="Cosmetology (Hairdressing and Beauty) Training"
              fee="1500 KSh"
              school="Waithaka Vocational Training Centre"
              applyByDate="12.02.24"
              startsOnDate="12.02.24"
              borderColor="#AD6A6C"
              href="#"
            />
            <ApplyCard
              tags={["Electrical", "Tag 2"]}
              title="Other course 3"
              fee="1500 KSh"
              school="Waithaka Vocational Training Centre"
              applyByDate="12.02.24"
              startsOnDate="12.02.24"
              borderColor="#283044"
              href="#"
            />
          </section>

          <Button className="max-w-3xs mx-auto mt-4 w-full" variant="secondary">
            View all <IconArrowRight />
          </Button>
        </Container>
      </section>

      <Container className="flex flex-col gap-4 px-0 lg:flex-row-reverse">
        <section className="mt-4 px-4 py-12 lg:shrink">
          <Heading type="h2" className="typo-h2">
            Nairobi Vocational Centres
          </Heading>

          <div className="mt-8 grid auto-cols-max gap-4">
            <div className="grid gap-1">
              <p className="typo-h5">Westlands</p>
              <Underline asChild>
                <Link href="/#">
                  Kangemi VTC (Mountain View)
                  <IconArrowRight />
                </Link>
              </Underline>
            </div>
            <div className="grid gap-1">
              <p className="typo-h5">Dagoretti South</p>
              <Underline asChild>
                <Link href="/#">
                  Waithaka VTC (Waithaka)
                  <IconArrowRight />
                </Link>
              </Underline>
            </div>
            <div className="grid gap-1">
              <p className="typo-h5">Embakasi North</p>
              <Underline asChild>
                <Link href="/#">
                  Dandora Greenlight VTC (Dandora 1)
                  <IconArrowRight />
                </Link>
              </Underline>
            </div>
            <div className="grid gap-1">
              <p className="typo-h5">Embakasi East</p>
              <Underline asChild>
                <Link href="/#">
                  Embakasi VTC (Embakasi)
                  <IconArrowRight />
                </Link>
              </Underline>
            </div>
            <div className="grid gap-1">
              <p className="typo-h5">Makadara</p>
              <Underline asChild>
                <Link href="/#">
                  Jericho VTC (Harambee)
                  <IconArrowRight />
                </Link>
              </Underline>
              <Underline asChild>
                <Link href="/#">
                  Bahari VTC (Maringo / Hamza)
                  <IconArrowRight />
                </Link>
              </Underline>
              <Underline asChild>
                <Link href="/#">
                  Ofafa VTC (Maringo / Hamza)
                  <IconArrowRight />
                </Link>
              </Underline>
            </div>
            <div className="grid gap-1">
              <p className="typo-h5">Roysambu</p>
              <Underline asChild>
                <Link href="/#">
                  Kiwanja VTC (Kahawa West)
                  <IconArrowRight />
                </Link>
              </Underline>
            </div>
            <div className="grid gap-1">
              <p className="typo-h5">Mathare</p>
              <Underline asChild>
                <Link href="/#">
                  Mathare VTC (Mabatini)
                  <IconArrowRight />
                </Link>
              </Underline>
              <Underline asChild>
                <Link href="/#">
                  Old Mathari VTC (Hospital)
                  <IconArrowRight />
                </Link>
              </Underline>
            </div>
            <div className="grid gap-1">
              <p className="typo-h5">Kahawa</p>
              <Underline asChild>
                <Link href="/#">
                  Kahawa Garrison VTC (Kahawa)
                  <IconArrowRight />
                </Link>
              </Underline>
            </div>
          </div>
        </section>

        <section className="map relative box-border min-h-[550px] w-full md:my-8">
          <Image
            src="/map.jpg"
            alt="Students in a classroom"
            fill
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            quality={100}
          />
          {/* <LocationMap positions={[{ lat: -33.866, lng: 151.196 }]} /> */}
        </section>
      </Container>

      <div className="bg-background">
        <Container className="mt-4 py-12">
          <Heading type="h2">Training areas</Heading>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-2 xl:grid-cols-3">
            <Link href="#">
              <TrainingAreaCard title="Beauty and hair">
                20 courses available
              </TrainingAreaCard>
            </Link>
            <Link href="#">
              <TrainingAreaCard title="Electricity">
                20 courses available
              </TrainingAreaCard>
            </Link>
            <Link href="#">
              <TrainingAreaCard title="Plumbing">
                20 courses available
              </TrainingAreaCard>
            </Link>
            <Link href="#">
              <TrainingAreaCard title="Computer packages">
                20 courses available
              </TrainingAreaCard>
            </Link>
            <Link href="#">
              <TrainingAreaCard title="Food and beverages">
                20 courses available
              </TrainingAreaCard>
            </Link>
            <Link href="#">
              <TrainingAreaCard title="Construction">
                20 courses available
              </TrainingAreaCard>
            </Link>
          </div>
        </Container>
        <Container className="bg-neutral-100 max-lg:px-0 lg:py-8">
          <RoundedCornerSection>
            <RoundedCornerSectionHeader asChild variant="rounded">
              <GradientCornerCard color="blue" gradient="blend1">
                <Heading
                  type="h2"
                  className="text-primary-foreground typo-h1-sm bottom-8 m-4 self-end"
                >
                  A Bright Future with TVET
                </Heading>
              </GradientCornerCard>
            </RoundedCornerSectionHeader>
            <RoundedCornerCard>
              <h3 className="font-bold">Looking for a path to success?</h3>
              <p>
                TVET (Technical and Vocational Education and Training) gives you
                the skills you need to build a career and take control of your
                future. Whether you want to become an electrician, chef,
                hairdresser, or entrepreneur, TVET equips you with hands-on
                training that prepares you for real jobs.
              </p>

              <div className="mt-6 flex justify-center">
                <Button className="max-w-3xs w-full">
                  Apply now <IconChecklist />
                </Button>
              </div>
            </RoundedCornerCard>
          </RoundedCornerSection>
        </Container>
      </div>
    </div>
  );
}
