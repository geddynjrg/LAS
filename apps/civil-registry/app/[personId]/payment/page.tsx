"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { use } from "react";

import { Button } from "@workspace/ui/components/button";
import { BackButton } from "@workspace/ui/components/civil-registry/back-button";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { DataPair } from "@workspace/ui/components/data-pair";
import { cn } from "@workspace/ui/lib/utils";

export interface PaymentPageProps {
  params: Promise<{ personId: string }>;
}

const MOCK_PURCHASES: {
  id: string;
  type: string;
  title: keyof IntlMessages["PaymentPage"];
  price: number;
}[] = [
  {
    id: "1",
    type: "childName",
    title: "child-name-change",
    price: 250,
  },
];

export default function PaymentPage({ params }: PaymentPageProps) {
  const { personId } = use(params);
  const router = useRouter();
  const t = useTranslations();

  const purchases = MOCK_PURCHASES;

  const total = purchases.reduce((acc, cur) => acc + cur.price, 0);

  return (
    <SectionWrap className={cn("space-y-6")} hasTopPadding hasBottomPadding>
      <BackButton />

      <div className={cn("space-y-5", "mb-8")}>
        <h2 className={cn("typo-h2")}>{t("PaymentPage.payment-title")}</h2>
        <p>{t("PaymentPage.payment-explanation")}</p>
      </div>

      <div>
        <h3
          className={cn(
            "typo-h3",
            "border-b border-solid border-neutral-400",
            "mb-3 pb-3",
          )}
        >
          {t("PaymentPage.cost-breakdown")}
        </h3>

        {/* cost breakdown */}
        <div className={cn("space-y-2")}>
          {purchases.map((purchase) => (
            <DataPair key={purchase.id}>
              <div style={{ wordBreak: "break-word" }}>
                {t(`PaymentPage.${purchase.title}`)}
              </div>
              <div className={cn("text-nowrap font-bold")}>
                {purchase.price} KSh
              </div>
            </DataPair>
          ))}
        </div>

        {/* total */}
        <DataPair
          className={cn(
            "typo-h5",
            "mt-3 pt-3",
            "border-t border-solid border-neutral-400",
          )}
        >
          <div>{t("Common.total")}</div>
          <div className={cn("font-bold")}>{total} KSh</div>
        </DataPair>
      </div>

      {/* payment methods */}
      <h3 className={cn("typo-h3", "mb-4")}>
        {t("PaymentPage.payment-method")}
      </h3>

      <div className={cn("flex flex-col gap-4")}>
        <Button
          className={cn("w-full max-w-[23rem]")}
          onClick={() => router.push(`amendment/success`)}
        >
          Payment option 1
        </Button>
        <Button
          className={cn("w-full max-w-[23rem]")}
          onClick={() => router.push(`amendment/success`)}
        >
          Payment option 2
        </Button>
        <Button
          className={cn("w-full max-w-[23rem]")}
          onClick={() => router.push(`amendment/success`)}
        >
          Payment option 3
        </Button>
      </div>
    </SectionWrap>
  );
}
