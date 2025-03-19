import {
  IconArrowRight,
  IconChevronDown,
  IconMail,
  IconPhone,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { Container } from "@workspace/ui/components/container";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";
import { Tag } from "@workspace/ui/components/tag";
import { Testimonial } from "@workspace/ui/components/testimonial";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import { RoundedCornerSection } from "@workspace/ui/components/tvet/rounded-corner-section";
import { SponsorshipCard } from "@workspace/ui/components/tvet/sponsorship-card";
import { Underline } from "@workspace/ui/components/underline";

import { GradientCornerCard } from "@/components/gradient-corner-card";
import { Heading } from "@/components/heading";
import { HeroSection } from "@/components/hero-section";
import { PageComponents } from "@/components/page-components";
import { ScrollTo } from "@/components/scroll-to";
import { getCourseData } from "@/lib/api/course";

interface PageProps {
  params: Promise<Record<string, string>>;
}

export default async function Page(props: PageProps) {
  const t = await getTranslations("FrontPage");
  const params = await props.params;
  const pageData = await getCourseData(params.course ?? "");

  console.log("COURSE", pageData);

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
            <Link
              href={`/institution/${pageData.data?.content?.institution?.id}`}
            >
              Waithaka Vocational Training Centre <IconArrowRight />
            </Link>
          </Underline>
          <div className="mt-4 flex gap-2">
            {pageData.data?.content?.tags?.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
      </HeroSection>

      <PageComponents
        page_components={pageData.data?.content.page_components ?? []}
      />

      {/* <section id="#sec" className="bg-neutral-100 pb-12 pt-8">
        <div className="app-container px-4">
          <strong>Learn the skills to power your future! </strong>
          <p>
            Our Electrical Installation course prepares you for a career as a
            technician, wireman, or even a business owner in the electrical
            field.
          </p>
        </div>
      </section>
      <section className="app-container bg-neutral-200 px-4">
        <div className="bg-primary [&>div]:mt-0.25 [&>div]:last:mb-0.25 grid grid-cols-1 text-center">
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Duration</p>
            <p>1-2 years</p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Fees</p>
            <p>Course fee: 5000 KSh</p>
            <p>Application fee: 250 KSh </p>
            <p>Test booking fee: 1000 KSh</p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Training Format</p>
            <p>90% practical, 10% theory</p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Group Size</p>
            <p>Up to 70 students</p>
            <p>Minimum of 4</p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Minimum entry requirements</p>
            <p>
              KCPE Certificate or Equivalent qualification approved by KNEC.
            </p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Equipment available at institution</p>
            <p>Equipment 1</p>
            <p>Equipment 2</p>
          </div>
        </div>
      </section>
      <section className="bg-neutral-100 pb-12 pt-8">
        <div className="app-container px-4">
          <div className="px-4">
            <Button className="mt-4 w-full">Apply now</Button>
          </div>
          <div className="mt-12">
            <Heading type="h3">Admission Requirements</Heading>
            <p className="mt-6 font-bold"> To join, you'll need:</p>
            <div className="mt-6">
              <ul className="ml-2 list-inside list-disc">
                <li>Black trousers/skirt & white shirt/blouse</li>
                <li>College T-shirt</li>
                <li>Pliers, hacksaw, screwdriver</li>
                <li>Bending spring, tape measure, spirit level</li>
                <li>2 passport-size photos & a plastic file</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="app-container flex flex-col gap-4 px-4 py-10">
        <Heading type="h3">What you'll learn</Heading>
        <p>
          From basic wiring to advanced electrical installation, this hands-on
          course will cover:
        </p>
        <NumberedList variant="bulletNumbers" className="typo-h6 gap-y-4">
          <NumberedListItem>
            Electrical systems for homes and businesses
          </NumberedListItem>
          <NumberedListItem>
            Installing industrial drives, bells, and alarms
          </NumberedListItem>
          <NumberedListItem>Equipment maintenance</NumberedListItem>
        </NumberedList>
      </section>

      <section className="bg-neutral-100 py-10">
        <div className="app-container gap-4 px-4">
          <Heading type="h3">Testimonials</Heading>
          <Carousel className="mt-6">
            <CarouselContent>
              <CarouselItem>
                <Testimonial
                  title="Name Lastname"
                  imageUrl="/testimonials/jane-doe.jpg"
                >
                  Lorem ipsum dolor sit amet consectetur. Urna purus orci quis
                  enim nec faucibus ac gravida.
                </Testimonial>
              </CarouselItem>
              <CarouselItem>
                <Testimonial
                  title="Name Lastname"
                  imageUrl="/testimonials/jane-doe.jpg"
                >
                  Lorem ipsum dolor sit amet consectetur. Urna purus orci quis
                  enim nec faucibus ac gravida.
                </Testimonial>
              </CarouselItem>
              <CarouselItem>
                <Testimonial
                  title="Name Lastname"
                  imageUrl="/testimonials/jane-doe.jpg"
                >
                  Lorem ipsum dolor sit amet consectetur. Urna purus orci quis
                  enim nec faucibus ac gravida.
                </Testimonial>
              </CarouselItem>
            </CarouselContent>

            <CarouselControls className="mt-6" />
          </Carousel>
        </div>
      </section>

      <section className="bg-neutral-100 pb-12 pt-8">
        <Container className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RoundedCornerSection layout="stacked">
            <GradientCornerCard color="green" gradient="blend1">
              <Heading type="h2" className="text-primary-foreground typo-h1-sm">
                Industrial training
              </Heading>
            </GradientCornerCard>
            <RoundedCornerCard>
              <h3 className="font-bold">Looking for a path to success?</h3>
              <p>
                Students gain real-world experience through domestic electrical
                installations and industrial machine drives.
              </p>
            </RoundedCornerCard>
          </RoundedCornerSection>

          <RoundedCornerSection layout="stacked">
            <GradientCornerCard color="red" gradient="blend2">
              <Heading type="h2" className="text-primary-foreground typo-h1-sm">
                Certification
              </Heading>
            </GradientCornerCard>
            <RoundedCornerCard>
              <h3 className="font-bold">Looking for a path to success?</h3>
              <p>
                Earn your NITA Certificate by passing the NITA Grade III, II,
                and I exams. This qualification is recognized across the
                industry and opens doors to better job opportunities.
              </p>
            </RoundedCornerCard>
          </RoundedCornerSection>

          <RoundedCornerSection layout="stacked">
            <GradientCornerCard color="blue" gradient="blend3">
              <Heading type="h2" className="text-primary-foreground typo-h1-sm">
                Career Path
              </Heading>
            </GradientCornerCard>
            <RoundedCornerCard>
              <h3 className="font-bold">Looking for a path to success?</h3>
              <div>
                After completing the course, you’ll be ready to work as:
                <ul className="ml-2 list-inside list-disc">
                  <li>Technician or Craftsman</li>
                  <li>Opportunities for further study with Master Craft III</li>
                </ul>
              </div>
            </RoundedCornerCard>
          </RoundedCornerSection>
        </Container>
      </section>

      <section className="py-10">
        <div className="app-container flex flex-col gap-4 px-4">
          <Heading type="h3">Available sponsorhips</Heading>
          <SponsorshipCard
            title="MPESA Foundation"
            description={
              "Eligibility is primarily for those who completed their KCSE and meet the placement criteria based on their exam results. Partially cover tuition fees."
            }
            applicationFormHref="#"
          />
          <SponsorshipCard
            title="Equity Foundation"
            description={
              "Applicants must demonstrate financial need, priority is often given to students from marginalized areas or with exceptional academic records. Cover full tuition, accommodation, and learning materials."
            }
            applicationFormHref="#"
          />
          <SponsorshipCard
            title="HELB TVET Bursaries"
            description={
              <p>
                Bursaries do not need to be repaid and are awarded based on
                merit or financial background.
                <br />
                Eligibility to Kenyan citizens, who have a valid admission
                letter to a registered VTC, and demonstrated financial need.
              </p>
            }
            applicationFormHref="#"
          />
        </div>
      </section>

      <section className="bg-neutral-100 py-10">
        <div className="app-container px-4">
          <Heading type="h3">Similar courses</Heading>
          <Carousel className="mt-6">
            <CarouselContent>
              <CarouselItem>
                <ApplyCard
                  className="w-full"
                  tags={["Electrical", "Tag 2"]}
                  title="Electrical installation"
                  fee="1500 KSh"
                  school="Waithaka Vocational Training Centre"
                  applyByDate="12.02.24"
                  startsOnDate="12.02.24"
                  borderColor="#588157"
                  href="#"
                />
              </CarouselItem>
              <CarouselItem>
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
              </CarouselItem>
              <CarouselItem>
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
              </CarouselItem>
            </CarouselContent>

            <CarouselControls className="mt-6" />
          </Carousel>
        </div>
      </section> */}
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
