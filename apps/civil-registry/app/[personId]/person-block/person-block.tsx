import { useFormatter, useTranslations } from "next-intl";
import { type FC } from "react";

import {
  DataBlock,
  DataBlockProps,
} from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";

import type { Person } from "@/lib/data/person";
import { getAgeByDoB } from "@/lib/util/age";
import { getFullName } from "@/lib/util/full-name";

interface DisplayFields {
  name?: boolean;
  nationalId?: boolean;
  dob?: boolean;
  age?: boolean;
  sex?: boolean;
  weightOnBirth?: boolean;
  placeOfBirth?: boolean;
  citizenship?: boolean;
  nationality?: boolean;
  maritalStatus?: boolean;
  education?: boolean;
  father?: boolean;
  phone?: boolean;
}

interface PersonBlockProps extends Pick<DataBlockProps, "active" | "disabled"> {
  person: Person;
  displayField: DisplayFields;
  active: boolean;
  toggleEdit: (id: string) => void;
}

export const PersonBlock: FC<PersonBlockProps> = ({
  disabled,
  active,
  person,
  displayField,
  toggleEdit,
}) => {
  const t = useTranslations();
  const format = useFormatter();

  type DataVariant = "default" | "disabled";
  const variant: DataVariant = disabled ? "disabled" : "default";

  return (
    <DataBlock
      title={t("DetailsPage.title-mother")}
      disabled={disabled}
      active={active}
      toggleEdit={() => toggleEdit(person?.id ?? "")}
    >
      {displayField.name && (
        <DataNode label={t("DetailsPage.name")} variant={variant}>
          {getFullName(person)}
        </DataNode>
      )}

      {displayField.nationalId && (
        <DataNode label={t("DetailsPage.national-id")} variant={variant}>
          {person.nationalId}
        </DataNode>
      )}
      {displayField.dob && (
        <DataNode label={t("DetailsPage.dob")} variant={variant}>
          {person.dob && format.dateTime(new Date(person.dob))}
        </DataNode>
      )}
      {displayField.age && (
        <DataNode label={t("DetailsPage.age")} variant={variant}>
          {person.dob ? getAgeByDoB(person.dob, true) : "N/A"}
        </DataNode>
      )}
      {displayField.sex && (
        <DataNode label={t("DetailsPage.sex")} variant={variant}>
          {person.sex}
        </DataNode>
      )}
      {displayField.weightOnBirth && (
        <DataNode label={t("DetailsPage.birth-weight")} variant={variant}>
          {person.weightOnBirth ?? "N/A"}
        </DataNode>
      )}
      {displayField.placeOfBirth && (
        <DataNode label={t("DetailsPage.place-of-birth")} variant={variant}>
          {person.placeOfBirth ?? "N/A"}
        </DataNode>
      )}
      {displayField.citizenship && (
        <DataNode label={t("DetailsPage.citizenship")} variant={variant}>
          {person.citizenship ?? "N/A"}
        </DataNode>
      )}
      {displayField.nationality && (
        <DataNode label={t("DetailsPage.nationality")} variant={variant}>
          {person.nationality ?? "N/A"}
        </DataNode>
      )}
      {displayField.maritalStatus && (
        <DataNode label={t("DetailsPage.marital-status")} variant={variant}>
          {person.maritalStatus ?? "N/A"}
        </DataNode>
      )}
      {displayField.education && (
        <DataNode label={t("DetailsPage.education")} variant={variant}>
          {person.education ?? "N/A"}
        </DataNode>
      )}
      {displayField.father && (
        <DataNode label={t("DetailsPage.fathers-name")} variant={variant}>
          {person?.father ? getFullName(person.father as Person) : "N/A"}
        </DataNode>
      )}
      {displayField.phone && (
        <DataNode label={t("DetailsPage.phone")} variant={variant}>
          {person.phone ?? "N/A"}
        </DataNode>
      )}
    </DataBlock>
  );
};
