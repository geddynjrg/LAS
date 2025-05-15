"use client";

import { useFormatter, useTranslations } from "next-intl";
import { type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { PersonAge } from "@workspace/ui/components/civil-registry/person-age";
import { DataNode } from "@workspace/ui/components/data-node";

import { type MultiChildSchema } from "@/app/add/child/child-schema";

type Child = MultiChildSchema["children"][number];

export interface FinalChildFormProps {
  defaultValues: Partial<Child>[];
}

export const FinalChildForm: FC<FinalChildFormProps> = ({ defaultValues }) => {
  const t = useTranslations();
  const format = useFormatter();

  const sexDisplayFormat = {
    M: t("DetailsPage.male"),
    F: t("DetailsPage.female"),
    I: t("DetailsPage.intersex"),
  };

  return defaultValues?.map((child, childIndex) => (
    <div key={childIndex}>
      <DataBlock
        title={t(`DetailsPage.title-child`)}
        disabled={undefined}
        active={undefined}
        toggleEdit={undefined}
        description="As registered at birth in the birth notification"
      >
        <DataNode label={t("DetailsPage.name")}>
          {[child.firstName, child.middleName].filter(Boolean).join(" ")}
        </DataNode>

        {child.dob && (
          <DataNode label={t("DetailsPage.dob")}>
            {format.dateTime(new Date(child.dob))}
          </DataNode>
        )}

        <DataNode label={t("DetailsPage.age")}>
          <PersonAge dob={child.dob} autoFormat />
        </DataNode>

        <DataNode label={t("DetailsPage.sex")}>
          {child.sex && sexDisplayFormat[child.sex]}
        </DataNode>

        <DataNode label={t("DetailsPage.birth-weight")}>
          {child.weightOnBirth + " kg"}
        </DataNode>

        <DataNode label={t("DetailsPage.place-of-birth")}>
          {getPlaceOfBirth({
            birthHappenedAtHome: child.birthHappenedAtHome,
            birthCounty: child.birthCounty,
            birthSubCounty: child.birthSubCounty,
            birthSublocation: child.birthSublocation,
            birthSublocationDistrict: child.birthSublocationDistrict,
            district: child.birthSublocationDistrict,
            healthInstitution: child.healthInstitution,
            healthInstitutionCounty: child.healthInstitutionCounty,
          })}
        </DataNode>
      </DataBlock>
    </div>
  ));
};

function getPlaceOfBirth(props: {
  birthHappenedAtHome?: string;
  birthCounty?: string;
  birthSubCounty?: string;
  birthSublocation?: string;
  birthSublocationDistrict?: string;
  subLocation?: string;
  district?: string;
  healthInstitutionCounty?: string;
  healthInstitution?: string;
}) {
  if (props.birthHappenedAtHome === "Yes") {
    return [
      props.birthCounty,
      props.birthSubCounty,
      props.birthSublocation,
      props.birthSublocationDistrict,
    ]
      .filter(Boolean)
      .join(", ");
  }
  return [props.healthInstitutionCounty, props.healthInstitution]
    .filter(Boolean)
    .join(", ");
}
