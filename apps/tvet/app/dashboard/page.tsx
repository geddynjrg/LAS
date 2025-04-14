import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { DataNode } from "@workspace/ui/components/data-node";
import { DataPair } from "@workspace/ui/components/data-pair";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { cn } from "@workspace/ui/lib/utils";

import { getProfile } from "@/lib/api/profile";
import { getUserApplications } from "@/lib/api/user-applications";

type ApplicationStatus = "accepted" | "pending" | "rejected";

type CourseType = {
  id: string;
  name: string;
  provider: string;
  status: ApplicationStatus;
  intake: string;
  duration: string;
};

const MOCK_COURSES: CourseType[] = [
  {
    id: "1",
    name: "Computer package course",
    provider: "Waithaka Vocational Training Centre",
    status: "accepted",
    intake: "January 2025",
    duration: "1 year",
  },
  {
    id: "2",
    name: "Computer package course",
    provider: "Waithaka Vocational Training Centre",
    status: "accepted",
    intake: "January 2025",
    duration: "1 year",
  },
  {
    id: "3",
    name: "Computer package course",
    provider: "Waithaka Vocational Training Centre",
    status: "accepted",
    intake: "January 2025",
    duration: "1 year",
  },
  {
    id: "4",
    name: "Electrical installation training",
    provider: "Waithaka Vocational Training Centre",
    status: "pending",
    intake: "January 2025",
    duration: "1 year",
  },
  {
    id: "5",
    name: "Electrical installation training",
    provider: "Waithaka Vocational Training Centre",
    status: "pending",
    intake: "January 2025",
    duration: "1 year",
  },
  {
    id: "6",
    name: "Plumbing course",
    provider: "Waithaka Vocational Training Centre",
    status: "rejected",
    intake: "January 2025",
    duration: "1 year",
  },
];

export default async function DashboardPage() {
  const courses = MOCK_COURSES;
  const userProfile = await getProfile();
  const userApplications = await getUserApplications();

  console.log("userApplications", userApplications);

  return (
    <SectionWrap hasBottomPadding>
      <h5 className={cn("typo-h5 mb-1")}>{userProfile?.data.name}</h5>
      <Heading type="h2">My applications</Heading>

      <div className={cn("mt-7 space-y-5")}>
        {courses.length < 1 && (
          <h5 className={cn("typo-h5 text-neutral-700")}>
            No open applications
          </h5>
        )}

        {userApplications &&
          userApplications.data.map((application) => (
            <CardWrap key={application.id}>
              <Card
                className={cn("border-primary")}
                title={application.course}
                caption={application.institution}
                statusLabel={application.application_status}
                variant={
                  application.application_status === "accepted"
                    ? "success"
                    : application.application_status === "rejected"
                      ? "danger"
                      : "warning"
                }
              >
                <DataPair className={cn("justify-around")}>
                  {/* <DataNode label="Intake">{application.intake}</DataNode>
                  <DataNode label="Duration">{application.duration}</DataNode> */}
                </DataPair>

                <Button>View next steps</Button>
              </Card>
            </CardWrap>
          ))}

        {/* accepted applications */}
        {getApplicationsByStatus(courses, "accepted") && (
          <CardWrap>
            {filterByCourseStatus(courses, "accepted").map((course) => (
              <Card
                className={cn("border-primary")}
                key={course.id}
                title={course.name}
                caption={course.provider}
                statusLabel="Accepted"
                variant="success"
              >
                <DataPair className={cn("justify-around")}>
                  <DataNode label="Intake">{course.intake}</DataNode>
                  <DataNode label="Duration">{course.duration}</DataNode>
                </DataPair>

                <Button>View next steps</Button>
              </Card>
            ))}
          </CardWrap>
        )}

        {/* pending applications */}
        {getApplicationsByStatus(courses, "pending") && (
          <CardWrap>
            {filterByCourseStatus(courses, "pending").map((course) => (
              <Card
                key={course.id}
                title={course.name}
                caption={course.provider}
                statusLabel="Application pending"
                variant="warning"
              >
                <DataPair className={cn("justify-around")}>
                  <DataNode label="Intake">{course.intake}</DataNode>
                  <DataNode label="Duration">{course.duration}</DataNode>
                </DataPair>

                <Button>View application</Button>
              </Card>
            ))}
          </CardWrap>
        )}

        {/* rejected applications */}
        {getApplicationsByStatus(courses, "rejected") && (
          <CardWrap>
            {filterByCourseStatus(courses, "rejected").map((course) => (
              <Card
                className={cn("border-red-400")}
                key={course.id}
                title={course.name}
                caption={course.provider}
                statusLabel="Rejected"
                variant="danger"
              >
                <DataPair className={cn("justify-around")}>
                  <DataNode label="Intake">{course.intake}</DataNode>
                  <DataNode label="Duration">{course.duration}</DataNode>
                </DataPair>

                <Button>View reason for rejection</Button>
              </Card>
            ))}
          </CardWrap>
        )}
      </div>
    </SectionWrap>
  );
}

const CardWrap: FC<{ children: ReactNode }> = ({ children }) => (
  <div
    className={cn(
      "flex flex-col gap-5",
      "md:grid md:grid-cols-2 md:flex-row md:flex-wrap",
      "empty:hidden",
    )}
  >
    {children}
  </div>
);

// check if there are any children to be rendered
function getApplicationsByStatus(
  courses: CourseType[],
  status: ApplicationStatus,
) {
  return courses.some((course) => course.status === status);
}

// check for certificate validation
function filterByCourseStatus(
  courses: CourseType[],
  status: ApplicationStatus,
) {
  const filteredCourses = courses.filter((course) => course.status === status);

  return filteredCourses;
}
