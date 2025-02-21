"use client";

import { IconId, IconPrinter } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  PersonCardFooterWrap,
  PersonCardLink,
} from "@workspace/ui/components/card";
import {
  PersonCard,
  type PersonType,
} from "@workspace/ui/components/civil-registry/person-card";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { cn } from "@workspace/ui/lib/utils";

const MOCK_CHILDREN: PersonType[] = [
  {
    id: "1",
    name: "David Otieno",
    sex: "M",
    age: "2 years",
    dob: new Date(2022, 3, 23).toISOString(),
    validationStatus: "alert",
  },
  {
    id: "2",
    name: "Grace Otieno",
    sex: "F",
    age: "1 month",
    dob: new Date(2024, 6, 12).toISOString(),
    validationStatus: "alert",
  },
  {
    id: "3",
    name: "Paul Otieno",
    sex: "M",
    age: "7 years",
    dob: new Date(2018, 0, 1).toISOString(),
    validationStatus: "success",
  },
  {
    id: "4",
    name: "John Rambo",
    sex: "M",
    age: "77 years",
    dob: new Date(1954, 4, 12).toISOString(),
    validationStatus: "pending",
  },
];

export default function Page() {
  const t = useTranslations();
  const format = useFormatter();

  return (
    <SectionWrap hasTopPadding hasBottomPadding className="space-y-8">
      <div className="space-y-4">
        <h2 className="typo-h2">{t("Dashboard.title")}</h2>
        <p>{t("Dashboard.description")}</p>
      </div>

      <h3 className={cn("typo-h3", "flex items-center gap-4")}>
        {t("Dashboard.children.title")}
        <div
          className={cn(
            "typo-h5",
            "grid place-content-center",
            "size-8",
            "rounded-full bg-neutral-400 text-neutral-100",
          )}
        >
          {MOCK_CHILDREN.length}
        </div>
      </h3>

      <div className={cn("space-y-8")}>
        {hasValidCertificate(MOCK_CHILDREN, "alert") && (
          <CardWrap>
            {filterByCertificateValidation(MOCK_CHILDREN, "alert").map(
              (child) => (
                <PersonCard
                  key={child.id}
                  variant="danger"
                  person={{
                    ...child,
                    dob: format.dateTime(new Date(child.dob)),
                  }}
                  statusLabel={t(
                    "Components.person-card.certificate-unavailable",
                  )}
                  footer={
                    <Button asChild>
                      <Link href={child.id}>
                        {t("Components.person-card.validate-data")}
                      </Link>
                    </Button>
                  }
                />
              ),
            )}
          </CardWrap>
        )}

        {hasValidCertificate(MOCK_CHILDREN, "pending") && (
          <CardWrap>
            {filterByCertificateValidation(MOCK_CHILDREN, "pending").map(
              (child) => (
                <PersonCard
                  key={child.id}
                  person={child}
                  variant="warning"
                  statusLabel={t("Components.person-card.amendments-processed")}
                  footer={
                    <PersonCardFooterWrap>
                      <PersonCardLink>
                        <IconId />
                        {t("Components.person-card.view-registration")}
                      </PersonCardLink>
                    </PersonCardFooterWrap>
                  }
                />
              ),
            )}
          </CardWrap>
        )}

        {hasValidCertificate(MOCK_CHILDREN, "success") && (
          <CardWrap>
            {filterByCertificateValidation(MOCK_CHILDREN, "success").map(
              (child) => (
                <PersonCard
                  key={child.id}
                  person={child}
                  variant="success"
                  statusLabel={t(
                    "Components.person-card.certificate-available",
                  )}
                  footer={
                    <PersonCardFooterWrap>
                      <PersonCardLink>
                        <IconPrinter />
                        {t("Components.person-card.view-certificate")}
                      </PersonCardLink>
                      <PersonCardLink>
                        <IconId />
                        {t("Components.person-card.issuance")}
                      </PersonCardLink>
                    </PersonCardFooterWrap>
                  }
                />
              ),
            )}
          </CardWrap>
        )}
      </div>
    </SectionWrap>
  );
}

const CardWrap: FC<{ children: ReactNode }> = ({ children }) => (
  <div
    className={cn(
      "flex flex-col gap-5",
      "md:grid md:grid-cols-2 md:flex-row md:flex-wrap",
      // lines between CardWrap components
      "not-first:border-t not-first:pt-8 not-first:border-solid not-first:border-neutral-400",
      "empty:hidden",
    )}
  >
    {children}
  </div>
);

// check if there are any children to be rendered
function hasValidCertificate(
  persons: PersonType[],
  status: PersonType["validationStatus"],
) {
  return persons.some((person) => person.validationStatus === status);
}

// check for certificate validation
function filterByCertificateValidation(
  persons: PersonType[],
  status: PersonType["validationStatus"],
) {
  const validatedPersons = persons.filter(
    (person) => person.validationStatus === status,
  );

  return validatedPersons;
}
