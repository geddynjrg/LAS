import { useTranslations } from "next-intl";

import { Button } from "@workspace/ui/components/button";
import { BackButton } from "@workspace/ui/components/civil-registry/back-button";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { DataPair } from "@workspace/ui/components/data-pair";
import { cn } from "@workspace/ui/lib/utils";

export interface PaymentPageProps {
  params: Promise<{ personId: string }>;
}

const MOCK_PURCHASES = [
  {
    id: "1",
    type: "childName",
    price: 250,
  },
  {
    id: "2",
    type: "childSex",
    price: 250,
  },
  {
    id: "3",
    type: "childDateOfBirth",
    price: 250,
  },
];

export default function PaymentPage({ params }: PaymentPageProps) {
  const t = useTranslations();

  const purchases = MOCK_PURCHASES;

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
              <div style={{ wordBreak: "break-word" }}>{purchase.type}</div>
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
          <div className={cn("font-bold")}>250 KSh</div>
        </DataPair>
      </div>

      {/* payment methods */}
      <h3 className={cn("typo-h3", "mb-4")}>
        {t("PaymentPage.payment-method")}
      </h3>

      <div className={cn("flex flex-col gap-4")}>
        <Button className={cn("w-full max-w-[23rem]")}>Payment option 1</Button>
        <Button className={cn("w-full max-w-[23rem]")}>Payment option 2</Button>
        <Button className={cn("w-full max-w-[23rem]")}>Payment option 3</Button>
      </div>
    </SectionWrap>
  );
}
