import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";

export interface CoursePageProps {
  params: Promise<{}>;
}

export default async function CoursePage({}: CoursePageProps) {
  return (
    <ApplyFormWrap prevUrl="guardian" nextUrl="confirmations">
      Course form
    </ApplyFormWrap>
  );
}
