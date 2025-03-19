import { IconArrowRight, IconSearch } from "@tabler/icons-react";
import { useFormatter } from "next-intl";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";
import { cn } from "@workspace/ui/lib/utils";

import { Heading } from "@/components/heading";
import type { HighlightedCourseListingBlockType } from "@/lib/api/types";

export interface HighlightedCourseListingBlockProps
  extends HighlightedCourseListingBlockType {}

export const HighlightedCourseListingBlock: FC<
  HighlightedCourseListingBlockProps
> = ({ courses }) => {
  const borders = ["#588157", "#AD6A6C", "#283044"];
  const format = useFormatter();

  return (
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
              href={`/institution/${course.institution?.id}/course/${course.id}`}
            />
          ))}
        </div>

        <Button
          className="md:max-w-3xs mx-auto mt-4 w-full"
          variant="secondary"
          asChild
        >
          <Link href="/courses">
            View all
            <IconArrowRight />
          </Link>
        </Button>
      </Container>
    </section>
  );
};
