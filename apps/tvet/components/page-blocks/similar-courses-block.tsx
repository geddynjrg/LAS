import { useFormatter } from "next-intl";
import type { FC, ReactNode } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";

import { Heading } from "@/components/heading";
import type { SimilarCoursesBlockType } from "@/lib/api/schema/block/similar-courses-block.schema";

export interface SimilarCoursesBlockProps extends SimilarCoursesBlockType {}

export const SimilarCoursesBlock: FC<SimilarCoursesBlockProps> = ({
  courses,
}) => {
  const format = useFormatter();

  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <section className="bg-neutral-100 py-10">
      <div className="app-container px-4">
        <Heading type="h3">Similar courses</Heading>
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
                  href={`/institution/${course.institution?.id}/course/${course.id}`}
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
