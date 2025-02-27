import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  OrderedListItem,
  OrderedListItemWrap,
} from "@workspace/ui/components/civil-registry/ordered-list-item";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { cn } from "@workspace/ui/lib/utils";

export interface SuccessPageProps {
  params: Promise<{}>;
}

export default function SuccessPage({}: SuccessPageProps) {
  const t = useTranslations();

  return (
    <SectionWrap hasTopPadding hasBottomPadding className={cn("space-y-6")}>
      <Button asChild variant="secondary">
        <Link href="/">
          <IconArrowLeft /> {t("Details.to-dashboard")}
        </Link>
      </Button>

      <h2
        className={cn(
          "typo-h2",
          "border-b border-solid border-neutral-400 pb-6",
        )}
      >
        {t("SuccessPage.title")}
      </h2>

      <div className={cn("space-y-4")}>
        <h3 className={cn("typo-h3")}>
          {t("SuccessPage.success-confirmation-title", {
            name: "David Otieno",
          })}
        </h3>

        <p>{t("SuccessPage.success-confirmation-text")}</p>
      </div>

      <h5 className={cn("typo-h5")}>{t("SuccessPage.instructions-title")}</h5>

      <OrderedListItemWrap>
        <OrderedListItem title={t("SuccessPage.go-to-office-title")}>
          {t("SuccessPage.go-to-office-text")}
        </OrderedListItem>

        <OrderedListItem title={t("SuccessPage.show-id-title")}>
          {t("SuccessPage.show-id-text")}
        </OrderedListItem>

        <OrderedListItem title={t("SuccessPage.wait-certificate-title")}>
          {t("SuccessPage.wait-certificate-text")}
        </OrderedListItem>
      </OrderedListItemWrap>

      <div className={cn("flex justify-center")}>
        <Button className={cn("max-w-full")}>
          {t("SuccessPage.find-registry-office")}
        </Button>
      </div>

      <div
        className={cn(
          "space-y-4",
          "border-t border-solid border-neutral-400 pt-6",
        )}
      >
        <h4 className={cn("typo-h4")}>{t("SuccessPage.benefits-title")}</h4>

        <ul className={cn("space-y-4")}>
          <li>
            {t.rich("SuccessPage.school-enrollment", {
              strong: (title) => <strong>{title}</strong>,
            })}
          </li>
          <li>
            {t.rich("SuccessPage.service-access", {
              strong: (title) => <strong>{title}</strong>,
            })}
          </li>
          <li>
            {t.rich("SuccessPage.legal-security", {
              strong: (title) => <strong>{title}</strong>,
            })}
          </li>
        </ul>
      </div>
    </SectionWrap>
  );
}
