import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";

export interface GuardianPageProps {
  params: Promise<{}>;
}

export default async function GuardianPage({}: GuardianPageProps) {
  return (
    <ApplyFormWrap prevUrl="applicant" nextUrl="course">
      Guardian form
    </ApplyFormWrap>
  );
}
