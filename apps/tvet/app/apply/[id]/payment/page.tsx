import Link from "next/link";

import { Button } from "@workspace/ui/components/button";

import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";

export interface PaymentPageProps {
  params: Promise<{}>;
}

export default async function PaymentPage({}: PaymentPageProps) {
  return (
    <ApplyFormWrap prevUrl="confirmations">
      payment form <br />
      <Button asChild>
        <Link href="../success">Payment 123</Link>
      </Button>
    </ApplyFormWrap>
  );
}
