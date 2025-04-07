"use client";

import {
  IconArrowLeft,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { Currency } from "@workspace/ui/components/currency";
import { DataPair } from "@workspace/ui/components/data-pair";
import { ModalButton } from "@workspace/ui/components/modal-button";
import { cn } from "@workspace/ui/lib/utils";

export const PaymentBar: FC<{
  onSubmit: () => void;
  price: number;
}> = ({ price, onSubmit }) => {
  const t = useTranslations();
  const [viewDetails, setViewDetails] = useState(false);

  return (
    <ActionBar>
      <Button
        variant="ghost"
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2",
          "rounded-bl-none rounded-br-none rounded-tl-xl rounded-tr-xl",
          "shadow-[var(--box-shadow-elevation-04)]",
          "bg-neutral-100 text-blue-400",
          "hover:bg-neutral-100 hover:text-blue-400",
          "active:bg-neutral-100",
        )}
        onClick={() => setViewDetails(!viewDetails)}
      >
        {viewDetails ? <IconChevronDown /> : <IconChevronUp />}
        {t("DetailsPage.view-const-breakdown")}
      </Button>
      <div className={cn("flex flex-grow flex-col gap-3")}>
        <div>
          <div className={cn("flex flex-grow items-center justify-between")}>
            <div>{t("DetailsPage.amendment-cost-label")}</div>
            <div className={cn("typo-h5")}>
              <Currency
                amount={price}
                currency="KES"
                minimumFractionDigits={0}
              />
            </div>
          </div>

          {viewDetails && (
            <>
              <DataPair className={cn("text-sm")}>
                <div>Child's name change</div>
                <Currency className="font-bold" amount={250} currency="KES" />
              </DataPair>
              <DataPair className={cn("text-sm")}>
                <div>Child's name change</div>
                <Currency className="font-bold" amount={250} currency="KES" />
              </DataPair>
              <DataPair className={cn("text-sm")}>
                <div>Child's name change</div>
                <Currency className="font-bold" amount={250} currency="KES" />
              </DataPair>
            </>
          )}
        </div>

        <div className={cn("flex flex-grow justify-between")}>
          <Button asChild variant="secondary">
            <Link href="/" className={cn("!px-5")}>
              <IconArrowLeft /> {t("DetailsPage.back")}
            </Link>
          </Button>
          <ModalButton
            onConfirm={onSubmit}
            modalTitle={t("DetailsPage.confirm-amendments-title")}
            modalText={t("DetailsPage.confirm-amendments-text")}
          >
            {t("DetailsPage.confirm-and-pay")} <IconCheck />
          </ModalButton>
        </div>
      </div>
    </ActionBar>
  );
};
