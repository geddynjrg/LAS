import { getTranslations } from "next-intl/server";

import { Button } from "@workspace/ui/components/button";
import { Currency } from "@workspace/ui/components/currency";
import { DataPair } from "@workspace/ui/components/data-pair";
import { cn } from "@workspace/ui/lib/utils";

import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { paymentAction } from "@/app/apply/[id]/payment/payment-action";
import {
  ensureStepAvailable,
  getPrevStep,
  type ApplicationStep,
} from "@/app/apply/[id]/stepper-utils";
import { getApplicationProgress } from "@/lib/api/application";

const STEP_NAME = "payment" satisfies ApplicationStep;

export interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const t = await getTranslations("ApplyForm");
  const { id } = await params;
  const application = await getApplicationProgress({ id });

  ensureStepAvailable(STEP_NAME, application);

  const defaultValues = application?.steps_data?.payment;

  return (
    <>
      <ApplyFormTitle application={application} />
      <ApplyFormStepper activeStep={STEP_NAME} application={application} />

      <ApplyFormWrap
        action={paymentAction}
        prevUrl={getPrevStep(STEP_NAME, application)}
        submitType="hidden"
      >
        <input type="hidden" name="application_id" value={id} />
        <ApplyFormSubtitle>{t("paymentTitle")}</ApplyFormSubtitle>

        <p>{t("paymentDescription")}</p>

        {defaultValues?.payment_amount && (
          <DataPair
            className={cn(
              "text-xl font-bold text-neutral-600",
              "mt-5 pt-5",
              "border-t border-solid border-neutral-400",
            )}
          >
            {t("cost")}
            <div className={cn("text-neutral-800")}>
              <Currency amount={defaultValues.payment_amount} currency="KES" />
            </div>
          </DataPair>
        )}

        <div className="mx-auto mt-8 flex max-w-[27rem] flex-col items-stretch gap-4">
          <Button type="submit" name="payment_method" value="m_pesa" disabled>
            {t("payUsing", { method: "M-Pesa" })}
          </Button>

          <Button type="submit" name="payment_method" value="pay_later">
            {t("payLater")}
          </Button>
        </div>
      </ApplyFormWrap>
    </>
  );
}
