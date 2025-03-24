import { getTranslations } from "next-intl/server";

import { Container } from "@workspace/ui/components/container";
import { Pagination } from "@workspace/ui/components/pagination";
import { Heading } from "@workspace/ui/components/tvet/heading";

import { CoursesDataTable } from "@/app/courses/course-data-table";
import { CourseFilter } from "@/app/courses/course-filter";
import {
  getCoursesTableData,
  type CoursesTableDataQueryParams,
} from "@/lib/api/courses";

interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<CoursesTableDataQueryParams>;
}

export default async function CoursesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const t = await getTranslations("CoursesPage");

  const { data, meta } = await getCoursesTableData(searchParams);

  return (
    <>
      <div className="bg-primary text-primary-foreground pt-(--header-height,4.5rem) px-4 pb-8">
        <Heading className="mt-4">{t("title")}</Heading>
        <div className="mt-4">{t("description")}</div>
      </div>

      <div className="bg-theme-100 pt-4">
        <CourseFilter
          educationLevels={meta?.filter_options.education_levels}
          institutions={meta?.filter_options.institutions}
          tags={meta?.filter_options.tags}
        />
      </div>

      <section className="bg-background flex-1 py-4">
        <Container>
          <CoursesDataTable
            courses={data?.courses ?? []}
            pagination={meta?.pagination}
          >
            <Pagination pageCount={Math.round(meta?.pagination.pages ?? 0)} />
          </CoursesDataTable>
        </Container>
      </section>
    </>
  );
}
