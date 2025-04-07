import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { BackButton } from "@workspace/ui/components/civil-registry/back-button";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { Currency } from "@workspace/ui/components/currency";
import { DataPair } from "@workspace/ui/components/data-pair";
import { cn } from "@workspace/ui/lib/utils";

import { getPersonById } from "@/actions/get-person-by-id";

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

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { personId } = await params;
  const t = await getTranslations();

  const person = await getPersonById(personId);
  const purchases = MOCK_PURCHASES;
  const total = purchases.reduce((acc, cur) => acc + cur.price, 0);

  if (!person) {
    throw new Error("Person not found");
  }

  return (
    <SectionWrap className={cn("space-y-6")} hasTopPadding hasBottomPadding>
      {person && (
        <BackButton
          url={`/${typeof person.mother === "string" ? person.mother : person.mother?.id}`}
        />
      )}

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

              <Currency
                className="text-nowrap font-bold"
                amount={purchase.price}
                currency="KES"
              />
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
          <Currency className="font-bold" amount={total} currency="KES" />
        </DataPair>
      </div>

      {/* payment methods */}
      <h3 className={cn("typo-h3", "mb-4")}>
        {t("PaymentPage.payment-method")}
      </h3>

      <div className={cn("flex flex-col gap-4")}>
        <Button className={cn("w-full max-w-[23rem]")} asChild>
          <Link href="amendment/success">Payment option 1</Link>
        </Button>
        <Button className={cn("w-full max-w-[23rem]")} asChild>
          <Link href="amendment/success">Payment option 2</Link>
        </Button>
        <Button className={cn("w-full max-w-[23rem]")} asChild>
          <Link href="amendment/success">Payment option 3</Link>
        </Button>
      </div>
    </SectionWrap>
  );
}
