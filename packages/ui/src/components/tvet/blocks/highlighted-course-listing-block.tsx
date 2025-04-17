import { IconArrowRight } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { SearchCoursesForm } from "@workspace/ui/components/tvet/search-courses-form";
import { cn } from "@workspace/ui/lib/utils";

export interface HighlightedCourseListingBlockProps {
  block_type: "highlighted_course_listing";

  courses: {
    id: string;
    title: string;
    tags: string[];
    application_fee: number | null;
    course_fee: number | null;
    apply_till: string[];
    start_on: string[];
    institution: {
      id: string;
      type: string;
      uuid: string;
      title: string;
      path_alias: string;
    };
    url: string;
    path_alias: string;
  }[];
}

export const HighlightedCourseListingBlock: FC<
  HighlightedCourseListingBlockProps
> = ({ courses }) => {
  const t = useTranslations("HighlightedCourseListingBlock");
  const format = useFormatter();

  const borders = ["#588157", "#AD6A6C", "#283044"];

  return (
    <section className="bg-background mt-4 pb-12 pt-8">
      <Container className="flex flex-col items-center gap-4">
        <Heading type="h2" className="w-full">
          {t("title")}
        </Heading>

        <div className="flex w-full flex-col items-center gap-4 rounded-md bg-[#ccc9c0] px-4 py-8">
          <h2 className="typo-h4 self-start">{t("searchTitle")}</h2>
          <SearchCoursesForm
            classname="w-full"
            placeholder={t("searchTitle")}
          />
        </div>

        <div
          className={cn(
            "grid w-full gap-4 xl:grid",
            courses.length === 2 && "xl:grid-cols-2",
            courses.length > 3 && "xl:grid-cols-3",
          )}
        >
          {courses.map((course) => (
            <ApplyCard
              key={course.id}
              tags={course.tags}
              title={course.title}
              fee={course.course_fee}
              school={(course.institution as { title: string }).title}
              applyByDate={format.dateTime(
                new Date(course.apply_till[0] ?? ""),
              )}
              startsOnDate={format.dateTime(new Date(course.start_on[0] ?? ""))}
              borderColor={borders[Math.floor(Math.random() * borders.length)]}
              href={course.path_alias}
            />
          ))}
        </div>

        <Button
          className="md:max-w-3xs mx-auto mt-4 w-full"
          variant="secondary"
          asChild
        >
          <Link href="/courses">
            {t("linkTitle")}
            <IconArrowRight />
          </Link>
        </Button>
      </Container>
    </section>
  );
};
