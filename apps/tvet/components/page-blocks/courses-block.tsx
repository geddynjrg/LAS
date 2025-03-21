"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";
import { cn } from "@workspace/ui/lib/utils";

import { Heading } from "@/components/heading";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { CoursesBlockType } from "@/lib/api/schema/block/course-block.schema";

const VISIBLE_COURSES_LIMIT = 6;

export interface CoursesBlockProps extends CoursesBlockType {}

export const CoursesBlock: FC<CoursesBlockProps> = ({
  title,
  short_description,
  courses,
}) => {
  const format = useFormatter();
  const t = useTranslations("Common");
  const [isAllCoursesVisible, setIsAllCoursesVisible] = useState(false);

  const visibleCourses = courses.slice(0, VISIBLE_COURSES_LIMIT);
  const hasHiddenCourses = courses.length > VISIBLE_COURSES_LIMIT;

  return (
    <section className="bg-background mt-4 px-4 pb-12 pt-8">
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
                href={`/institution/${course.institution?.id}/course/${course.id}`}
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
