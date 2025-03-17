import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";

export interface ConfirmationsPageProps {
  params: Promise<{}>;
}

export default async function ConfirmationsPage({}: ConfirmationsPageProps) {
  return (
    <ApplyFormWrap prevUrl="course" nextUrl="payment">
      confirmations form
    </ApplyFormWrap>
  );
}
