"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { cn } from "@workspace/ui/lib/utils";

const VISIBLE_COURSES_LIMIT = 6;

export interface CoursesBlockProps {
  className?: string;
  block_type: "courses";
  title: string;
  short_description: {
    value: string | null;
    format: string | null;
    processed: string | null;
  };
  courses: {
    title: string;
    tags: string[];
    id: string;
    url: string;
    path_alias: string;
    application_fee: number | null;
    course_fee: number | null;
    apply_till: string[];
    start_on: string[];
    institution: {
      title: string;
      type: string;
      id: string;
      uuid: string;
      path_alias: string;
    };
  }[];
}

export const CoursesBlock: FC<CoursesBlockProps> = ({
  title,
  short_description,
  courses,
  className,
}) => {
  const format = useFormatter();
  const t = useTranslations("CourseBlock");
  const [isAllCoursesVisible, setIsAllCoursesVisible] = useState(false);

  const visibleCourses = courses.slice(0, VISIBLE_COURSES_LIMIT);
  const hasHiddenCourses = courses.length > VISIBLE_COURSES_LIMIT;

  return (
    <section className={cn("bg-background mt-4 px-4 pb-12 pt-8", className)}>
      <div className="app-container">
        <Heading type="h2">{title}</Heading>
        <div className="mt-4">
          <DescriptionBlock {...short_description} />
        </div>

        <section
          className={cn(
            "mt-4 grid gap-4 xl:grid",
            courses.length === 2 && "xl:grid-cols-2",
            courses.length > 3 && "xl:grid-cols-3",
          )}
        >
          {(isAllCoursesVisible ? courses : visibleCourses).map(
            (course, index) => (
              <ApplyCard
                key={index}
                tags={course.tags}
                title={course.title}
                fee={course.course_fee}
                school={(course.institution as { title: string }).title}
                applyByDate={format.dateTime(
                  new Date(course.apply_till[0] ?? ""),
                )}
                startsOnDate={format.dateTime(
                  new Date(course.start_on[0] ?? ""),
                )}
                href={course.path_alias}
                variant="secondary"
              />
            ),
          )}
        </section>

        {hasHiddenCourses && !isAllCoursesVisible && (
          <div className="flex justify-center lg:mt-8">
            <Button
              variant="secondary"
              className="max-w-3xs mt-4 w-full"
              onClick={() => setIsAllCoursesVisible(true)}
            >
              {t("viewAll")} <IconChevronDown />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
