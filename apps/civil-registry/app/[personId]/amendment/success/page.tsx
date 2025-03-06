import { IconMail, IconPhone } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { BackButton } from "@workspace/ui/components/civil-registry/back-button";
import {
  OrderedListItem,
  OrderedListItemWrap,
} from "@workspace/ui/components/civil-registry/ordered-list-item";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { cn } from "@workspace/ui/lib/utils";

export interface SuccessPageProps {
  params: Promise<{}>;
}

export default function AmendmentSuccessPage({}: SuccessPageProps) {
  const t = useTranslations();

  return (
    <SectionWrap hasTopPadding hasBottomPadding className={cn("space-y-6")}>
      <h2
        className={cn(
          "typo-h2",
          "border-b border-solid border-neutral-400 pb-6",
        )}
      >
        {t("Amendment.title")}
      </h2>

      <div className={cn("flex justify-center")}>
        <BackButton variant="default" />
      </div>

      <h5 className={cn("typo-h5")}>{t("Amendment.process-title")}</h5>

      <OrderedListItemWrap>
        <OrderedListItem title={t("Amendment.review-application-title")}>
          {t("Amendment.review-application-text")}
        </OrderedListItem>

        <OrderedListItem title={t("Amendment.check-records-title")}>
          {t("Amendment.check-records-text")}
        </OrderedListItem>

        <OrderedListItem title={t("Amendment.approval-title")}>
          {t("Amendment.approval-text")}
        </OrderedListItem>
      </OrderedListItemWrap>

      <div
        className={cn(
          "space-y-4",
          "border-t border-solid border-neutral-400 pt-6",
        )}
      >
        <h4 className={cn("typo-h4")}>{t("Amendment.what-to-know-title")}</h4>

        <ul className={cn("space-y-4")}>
          <li>
            {t.rich("Amendment.permanent-records", {
              strong: (title) => <strong>{title}</strong>,
            })}
          </li>
          <li>
            {t.rich("Amendment.legal-considerations", {
              strong: (title) => <strong>{title}</strong>,
            })}
          </li>
        </ul>
      </div>

      <div
        className={cn(
          "border-t border-solid border-neutral-400 pt-6",
          "space-y-4",
        )}
      >
        <h4 className={cn("typo-h4")}>{t("Amendment.more-questions")}</h4>
        <div>{t("Amendment.contact-us")}</div>
        <div className={cn("flex items-start")}>
          <a
            className={cn(
              "inline-flex gap-1",
              "border-link border-b border-solid",
              "text-neutral-1000",
            )}
            href="mailto:info@crs.go.ke"
          >
            <IconMail size={20} className={cn("text-link", "shrink-0")} />
            info@crs.go.ke
          </a>
        </div>

        <div className={cn("flex items-start")}>
          <a
            className={cn(
              "inline-flex gap-1",
              "border-link border-b border-solid",
              "text-neutral-1000",
            )}
            href="tel:01100333232"
          >
            <IconPhone size={20} className={cn("text-link", "shrink-0")} />
            +254 (0) 1100 333 232
          </a>
        </div>
      </div>
    </SectionWrap>
  );
}
