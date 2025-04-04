import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { DataPair } from "@workspace/ui/components/data-pair";
import { cn } from "@workspace/ui/lib/utils";

import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";

export default async function PaymentPage() {
  return (
    <ApplyFormWrap prevUrl="confirmations" submitType="hidden">
      <ApplyFormSubtitle>Payment</ApplyFormSubtitle>

      <p>
        An application fee is required to cover the administrative costs
        involved in processing student applications. The application fee is
        non-refundable. Be aware that without the payment of this fee, your
        application will not be processed.
      </p>

      <DataPair
        className={cn(
          "text-xl font-bold text-neutral-600",
          "mt-5 pt-5",
          "border-t border-solid border-neutral-400",
        )}
      >
        <div>Cost</div>
        <div className={cn("text-neutral-800")}>250KSh</div>
      </DataPair>

      <div className={cn("flex flex-col items-center gap-4", "mt-8")}>
        <Button className={cn("w-full max-w-[27rem]")} asChild>
          <Link href="../success">Pay using M-Pesa</Link>
        </Button>

        <Button className={cn("w-full max-w-[27rem]")} asChild>
          <Link href="../success">Pay using M-Pesa</Link>
        </Button>
      </div>
    </ApplyFormWrap>
  );
}
