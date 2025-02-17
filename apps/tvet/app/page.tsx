import {
  IconArrowRight,
  IconCertificate2,
  IconChecklist,
  IconChevronDown,
  IconCoins,
  IconId,
  IconSearch,
  IconTimeline,
  IconTools,
  IconZoomMoney,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { IconBlock } from "@workspace/ui/components/icon-block";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";
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

      <section className="mt-4 px-4">
        <h2 className="typo-h2">Application process and admission details</h2>
        <hr />

        <section className="mt-4">
          <h2 className="typo-h3">To apply, you need to prepare:</h2>
          <NumberedList className="my-4">
            <NumberedListItem icon={<IconId />}>
              National ID or birth certificate
            </NumberedListItem>
            <NumberedListItem icon={<IconCertificate2 />}>
              Some courses may require educational certificates (KCSE, KCPE, or
              quivalent)
            </NumberedListItem>
            <NumberedListItem icon={<IconCoins />}>
              250 KSh to pay the application fee
            </NumberedListItem>
          </NumberedList>
        </section>
        <hr />

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
      </section>

      <section className="mt-4">
        <div className="relative aspect-[4/5] overflow-clip rounded-tr-xl sm:aspect-[16/9] md:max-h-96 md:w-full">
          <Image
            fill
            priority
            className="object-cover"
            src="/hero-banners/banner-1.jpg"
            alt="Students in a classroom"
          />
          <div className="bg-primary-hover absolute inset-0 opacity-40" />

          <Heading className="text-primary-foreground absolute bottom-8 z-10 m-4">
            Unlock Your Future with TVET Training
          </Heading>
        </div>

        <RoundedCard className="relative -mt-4">
          <h3 className="font-bold">Looking for a path to success?</h3>
          <p>
            TVET (Technical and Vocational Education and Training) gives you the
            skills you need to build a career and take control of your future.
            Whether you want to become an electrician, chef, hairdresser, or
            entrepreneur, TVET equips you with hands-on training that prepares
            you for real jobs.
          </p>
        </RoundedCard>
      </section>

      <section className="mt-8 bg-neutral-100 px-4 pb-20">
        <div className="flex flex-col gap-6">
          <IconBlock title="Practical Skills" icon={<IconTools />}>
            90% of your time will be spent learning by doing, giving you the
            confidence to apply your skills in the workplace
          </IconBlock>
          <IconBlock title="In-demand Careers" icon={<IconTimeline />}>
            TVET connects you directly with industries looking for trained
            professionals.
          </IconBlock>
          <IconBlock title="Affordable & Accessible" icon={<IconZoomMoney />}>
            With TVET, you get high-quality training that’s affordable and
            available near you.
          </IconBlock>
        </div>

        <p className="mt-8">
          No matter your background, TVET will give you the{" "}
          <strong>tools to succeed and grow.</strong> Start your journey today
          and <strong>be part of Kenya’s future!</strong>
        </p>
      </section>

      <section className="mt-4 flex flex-col gap-2 bg-neutral-200 px-4 py-10">
        <Heading>Get sponsored to train</Heading>
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
      </section>

      <section className="mt-4 bg-neutral-100 px-4 py-8">
        <Heading>Apply now</Heading>
        <div className="mt-4 flex flex-col items-center gap-4 rounded-md bg-[#ccc9c0] px-4 py-8">
          <h2 className="typo-h4">Search for courses</h2>
          <div className="flex w-full justify-between gap-4 rounded-md bg-neutral-100 p-2">
            Search for courses
            <IconSearch />
          </div>
        </div>
        <section className="mt-4 flex flex-col gap-4">
          <ApplyCard
            tags={["Electrical", "Tag 2"]}
            title="Electrical installation"
            fee="1500 KSh"
            school="Waithaka Vocational Training Centre"
            applyByDate="12.02.24"
            startsOnDate="12.02.24"
            borderColor="#588157"
          />
          <ApplyCard
            tags={["Beauty", "Hairdressing"]}
            title="Cosmetology (Hairdressing and Beauty) Training"
            fee="1500 KSh"
            school="Waithaka Vocational Training Centre"
            applyByDate="12.02.24"
            startsOnDate="12.02.24"
            borderColor="#AD6A6C"
          />
          <ApplyCard
            tags={["Electrical", "Tag 2"]}
            title="Other course 3"
            fee="1500 KSh"
            school="Waithaka Vocational Training Centre"
            applyByDate="12.02.24"
            startsOnDate="12.02.24"
            borderColor="#283044"
          />
        </section>

        <Button className="mt-8 w-full" variant="secondary">
          View all <IconArrowRight />
        </Button>
      </section>
    </div>
  );
}
