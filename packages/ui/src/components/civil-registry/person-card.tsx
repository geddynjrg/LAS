import { useTranslations } from "next-intl";
import type { FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Card, type CardProps } from "@workspace/ui/components/card";
import { PersonAge } from "@workspace/ui/components/civil-registry/person-age";
import { DataNode } from "@workspace/ui/components/data-node";
import { DataPair } from "@workspace/ui/components/data-pair";
import { cn } from "@workspace/ui/lib/utils";

export type SexType = "M" | "F" | "I";
export type ValidationStatus = "success" | "alert" | "pending";

export type PersonType = {
  id: string;
  name: string;
  dob: string;
  dobFormatted: string;
  sex?: SexType | null | undefined;
  validationStatus?: ValidationStatus;
};

export interface PersonCardProps extends CardProps {
  person: PersonType;
}

export const PersonCard: FC<PersonCardProps> = ({ person, ...props }) => {
  const t = useTranslations("PersonCard");
  const { name, sex, dob, dobFormatted, validationStatus } = person ?? {};

  return (
    <Card title={name} {...props}>
      {validationStatus === "alert" && (
        <Alert variant="warning">
          {t("birthRegistrationRequiresValidation")}
        </Alert>
      )}

      {validationStatus === "pending" && (
        <Alert variant="warning">{t("amendmentsNeedToBeProcessed")}</Alert>
      )}

      <DataPair
        className={cn(
          "px-4",
          "sm:gap-8 sm:self-center",
          "md:gap-0 md:self-auto",
        )}
      >
        <DataNode label={t("sex")}>
          <PersonSex sex={sex} />
        </DataNode>
        <DataNode label={t("age")}>
          <PersonAge dob={dob} autoFormat />
        </DataNode>
        <DataNode label={t("dob")}>{dobFormatted}</DataNode>
      </DataPair>
    </Card>
  );
};

function PersonSex({ sex }: { sex: SexType | null | undefined }) {
  const t = useTranslations("DetailsPage");
  switch (sex) {
    case "M":
      return t("male");
    case "F":
      return t("female");
    case "I":
      return t("intersex");
    default:
      return "-";
  }
}
