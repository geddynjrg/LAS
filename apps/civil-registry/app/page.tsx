"use server";

import { IconId, IconPrinter } from "@tabler/icons-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  PersonCardFooterWrap,
  PersonCardLink,
} from "@workspace/ui/components/card";
import { PersonCard } from "@workspace/ui/components/civil-registry/person-card";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { cn } from "@workspace/ui/lib/utils";

import { getPersonById } from "@/actions/get-person-by-id";
import type { Person, ValidationStatus } from "@/lib/data/person";
import { getAgeByDoB } from "@/lib/util/age";
import { getFullName } from "@/lib/util/full-name";

export interface MainPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: MainPageProps) {
  const { id } = await params;

  const personId = id ?? "1";

  const t = await getTranslations();
  const format = await getFormatter();
  const person = await getPersonById(personId);

  return (
    <SectionWrap hasTopPadding hasBottomPadding className="space-y-8">
      <div className="space-y-4">
        <h2 className="typo-h2">{t("DashboardPage.title")}</h2>
        <p>{t("DashboardPage.description")}</p>
      </div>

      <h3 className={cn("typo-h3", "flex items-center gap-4")}>
        {t("DashboardPage.children.title")}
        <div
          className={cn(
            "typo-h5",
            "grid place-content-center",
            "size-8",
            "rounded-full bg-neutral-400 text-neutral-100",
          )}
        >
          {person?.children?.length ?? 0}
        </div>
      </h3>

      <div className={cn("space-y-8")}>
        {hasValidCertificate(person?.children as Person[], "alert") && (
          <CardWrap>
            {filterByCertificateValidation(
              person?.children as Person[],
              "alert",
            ).map((child) => (
              <PersonCard
                key={child.id}
                variant="danger"
                person={{
                  ...child,
                  id: child?.id ?? "",
                  name: getFullName(child),
                  dob: child.dob ? format.dateTime(new Date(child.dob)) : "N/A",
                  age: child.dob ? getAgeByDoB(child.dob, true) : "N/A",
                }}
                statusLabel={t(
                  "Components.person-card.certificate-unavailable",
                )}
                footer={
                  <Button asChild>
                    {child.id && (
                      <Link href={`/edit/${child.id}`}>
                        {t("Components.person-card.validate-data")}
                      </Link>
                    )}
                  </Button>
                }
              />
            ))}
          </CardWrap>
        )}

        {hasValidCertificate(person?.children as Person[], "pending") && (
          <CardWrap>
            {filterByCertificateValidation(
              person?.children as Person[],
              "pending",
            ).map((child) => (
              <PersonCard
                key={child.id}
                person={{
                  ...child,
                  id: child?.id ?? "",
                  name: getFullName(child),
                  dob: child.dob ? format.dateTime(new Date(child.dob)) : "N/A",
                  age: child.dob ? getAgeByDoB(child.dob, true) : "N/A",
                }}
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
            ))}
          </CardWrap>
        )}

        {hasValidCertificate(person?.children as Person[], "success") && (
          <CardWrap>
            {filterByCertificateValidation(
              person?.children as Person[],
              "success",
            ).map((child) => (
              <PersonCard
                key={child.id}
                person={{
                  ...child,
                  id: child?.id ?? "",
                  name: getFullName(child),
                  dob: child.dob ? format.dateTime(new Date(child.dob)) : "N/A",
                  age: child.dob ? getAgeByDoB(child.dob, true) : "N/A",
                }}
                variant="success"
                statusLabel={t("Components.person-card.certificate-available")}
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
            ))}
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
function hasValidCertificate(persons: Person[], status: ValidationStatus) {
  return persons.some((person) => person.validationStatus === status);
}

// check for certificate validation
function filterByCertificateValidation(
  persons: Person[],
  status: ValidationStatus,
) {
  const validatedPersons = persons.filter(
    (person) => person.validationStatus === status,
  );

  return validatedPersons;
}
