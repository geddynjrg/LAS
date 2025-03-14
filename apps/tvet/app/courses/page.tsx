import { Container } from "@workspace/ui/components/container";
import { Pagination } from "@workspace/ui/components/pagination";
import { Select } from "@workspace/ui/components/select";

import { CoursesDataTable } from "@/app/courses/course-data-table";
import { CourseFilter } from "@/app/courses/course-filter";
import { Heading } from "@/components/heading";

const courseDataMock: CourseDataResponse = {
  page: 1,
  total: 200,
  take: 10,
  items: [
    {
      title: "Electrical installation training",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/1",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Cosmetology (Hairdressing and Beauty) Training",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/2",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Plumbing training",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/3",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Electrical installation",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/4",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Computer package",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/5",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "ICT course",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/6",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Food and beverage course ",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/7",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Computer package",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/8",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Computer package",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/9",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Construction course",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/10",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
  ],
};

type CourseData = {
  title: string;
  location: string;
  link: string;
  courseFee: string;
  applicationFee: string;
  testBookingFee: string;
  duration: string;
  groupSize: string;
  tags: string[];
  requiredEducation: string;
};

interface CourseDataResponse {
  page: number;
  total: number;
  take: number;
  items: Array<CourseData>;
}

// mock course data fetch
const getCourseData = async (): Promise<CourseDataResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(courseDataMock);
    }, 0);
  });
};

interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CoursesPage(props: PageProps) {
  const courseData = await getCourseData();
  const params = await props.params;
  const searchParams = await props.searchParams;

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
        <CourseFilter />
      </div>
      <section className="bg-background py-4">
        <Container>
          <CoursesDataTable
            data={courseData}
            // orderBy={orderBy}
            // onOrderByChange={handleOrderByChange}
          >
            <Pagination
              pageCount={Math.round(courseData.total / courseData.take)}
            />
          </CoursesDataTable>
        </Container>
      </section>
    </>
  );
}
