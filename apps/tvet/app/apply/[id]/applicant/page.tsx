import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";

export interface ApplicantPageProps {
  params: Promise<{}>;
}

export default async function ApplicantPage({}: ApplicantPageProps) {
  return (
    <ApplyFormWrap cancelUrl="/dashboard" nextUrl="guardian">
      Applicant form
    </ApplyFormWrap>
  );
}
