import { Container } from "@workspace/ui/components/container";
import { Pagination } from "@workspace/ui/components/pagination";

import { CoursesDataTable } from "@/app/courses/course-data-table";
import { CourseFilter } from "@/app/courses/course-filter";
import { Heading } from "@/components/heading";
import {
  getCoursesTableData,
  type CoursesTableDataQueryParams,
} from "@/lib/api/courses";

interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<CoursesTableDataQueryParams>;
}

export default async function CoursesPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const filterParams = {
    search: searchParams.search,
    min_fee: searchParams.min_fee,
    max_fee: searchParams.max_fee,
    min_duration: searchParams.min_duration,
    max_duration: searchParams.max_duration,
    education_level: searchParams.education_level,
    institution: searchParams.institution,
    page: searchParams.page,
    limit: searchParams.limit,
    sort: searchParams.sort,
    direction: searchParams.direction,
  };

  const courseData = await getCoursesTableData({
    ...filterParams,
  });

  // console.log("COURSES AFTER", courseData);
  console.log({ params, searchParams });

  return (
    <>
      <div className="bg-primary text-primary-foreground pt-(--header-height,4.5rem) px-4 pb-8">
        <Heading className="mt-4">All courses</Heading>
        <div className="mt-4">
          Here you can find and search all the courses offered by all the
          Nairobi County TVETs.
        </div>
      </div>
      <div className="bg-theme-100 pt-4">
        <CourseFilter {...courseData.meta.filter_options} />
      </div>
      <section className="bg-background py-4">
        <Container>
          <CoursesDataTable
            courseData={courseData}
            // orderBy={orderBy}
            // onOrderByChange={handleOrderByChange}
          >
            <Pagination
              pageCount={Math.round(courseData.meta.pagination.pages)}
            />
          </CoursesDataTable>
        </Container>
      </section>
    </>
  );
}
