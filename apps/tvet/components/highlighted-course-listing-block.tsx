import { IconArrowRight, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";

import { Heading } from "@/components/heading";
import type { HighlightedCourseListingBlockType } from "@/lib/api/types";

export interface HighlightedCourseListingBlockProps
  extends HighlightedCourseListingBlockType {}

export const HighlightedCourseListingBlock: FC<
  HighlightedCourseListingBlockProps
> = ({ courses }) => {
  const borders = ["#588157", "#AD6A6C", "#283044"];
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

        <section className="grid w-full gap-4 xl:grid xl:grid-cols-3">
          {courses.map((course) => (
            <ApplyCard
              tags={course.tags}
              title={course.title}
              fee={course.course_fee}
              school={(course.institution as { title: string }).title}
              applyByDate={course.apply_till.toString()}
              startsOnDate={course.start_on.toString()}
              borderColor={borders[Math.floor(Math.random() * borders.length)]}
              href={course.url}
            />
          ))}
        </section>

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
