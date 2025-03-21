import { getTranslations } from "next-intl/server";

import { Button } from "@workspace/ui/components/button";
import { BackButton } from "@workspace/ui/components/civil-registry/back-button";
import {
  OrderedListItem,
  OrderedListItemWrap,
} from "@workspace/ui/components/civil-registry/ordered-list-item";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { cn } from "@workspace/ui/lib/utils";

import { getPersonById } from "@/actions/get-person-by-id";
import { getFullName } from "@/lib/util/full-name";

export interface SuccessPageProps {
  params: Promise<{ personId: string }>;
}

export default async function SuccessPage({ params }: SuccessPageProps) {
  const t = await getTranslations();

  const { personId } = await params;

  if (!personId) {
    return <p>Error: person Id is missing</p>;
  }

  const person = await getPersonById(personId);

  if (!person) {
    return <p>Error: person not found</p>;
  }

  return (
    <SectionWrap hasTopPadding hasBottomPadding className={cn("space-y-6")}>
      <div className={cn("flex justify-center")}>
        <BackButton
          url={`/${typeof person.mother === "string" ? person.mother : person.mother?.id}`}
        />
      </div>

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
            name: getFullName(person),
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
        <Button className={cn("w-full max-w-[23rem]", "px-3")}>
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
