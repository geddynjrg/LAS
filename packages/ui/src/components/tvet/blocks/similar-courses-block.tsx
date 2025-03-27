import { useFormatter, useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { cn } from "@workspace/ui/lib/utils";

export interface SimilarCoursesBlockProps {
  className?: string;
  block_type: "similar_courses";
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
      id: string;
      type: string;
      uuid: string;
      title: string;
      path_alias: string;
    };
  }[];
}

export const SimilarCoursesBlock: FC<SimilarCoursesBlockProps> = ({
  courses,
  className,
}) => {
  const format = useFormatter();
  const t = useTranslations("SimilarCoursesBlock");

  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <section className={cn("bg-neutral-100 py-10", className)}>
      <div className="app-container px-4">
        <Heading type="h3">{t("similarCourses")}</Heading>
        <Carousel className="mt-6">
          <CarouselContent>
            {courses.map((course, key) => (
              <CarouselItem key={`course-${key}`}>
                <ApplyCard
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
                  borderColor="#588157"
                  href={course.path_alias}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselControls className="mt-6" />
        </Carousel>
      </div>
    </section>
  );
};
