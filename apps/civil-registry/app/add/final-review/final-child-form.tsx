"use client";

import { useTranslations } from "next-intl";
import React, { useState, type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { childAction } from "@/app/add/child/child-action";
import { childSchema, type ChildSchema } from "@/app/add/child/child-schema";
import { healthInstitutionsOptions } from "@/lib/data/dummy-data";

export interface FinalChildFormProps {
  defaultValues?: Partial<ChildSchema>;
}

export const FinalChildForm: FC<FinalChildFormProps> = ({ defaultValues }) => {
  const t = useTranslations();
  const [state] = useForm(childAction, childSchema, defaultValues);
  type DataVariant = "default" | "disabled";
  const variant: DataVariant = "default";

  const natureOfBirthOptions = [
    { label: t("DetailsPage.live-birth"), value: "LiveBirth" },
    { label: t("DetailsPage.stillbirth"), value: "StillBirth" },
  ];

  const sexDisplayFormat = {
    M: t("DetailsPage.male"),
    F: t("DetailsPage.female"),
    I: t("DetailsPage.intersex"),
  };

  const [placeOfBirthLocation, setPlaceOfBirthLocation] = useState<string>(
    defaultValues?.healthInstitution ?? "",
  );

  return (
    <DataBlock
      title={t(`DetailsPage.title-child`)}
      disabled={undefined}
      active={undefined}
      toggleEdit={undefined}
      description="As registered at birth in the birth notification"
    >
      <Field
        control={(props) => {
          return (
            <RadioGroup
              {...props}
              options={natureOfBirthOptions}
              orientation="horizontal"
              size="md"
            />
          );
        }}
        label={t("DetailsPage.nature-of-birth")}
        name="natureOfBirth"
        state={state}
        editable={false}
      />

      <Field
        state={state}
        name="firstName"
        label={t("DetailsPage.first-name")}
        control={(props) => <Input {...props} />}
        editable={false}
      />

      <Field
        state={state}
        name="middleName"
        label={t("DetailsPage.middle-name")}
        control={(props) => <Input {...props} />}
        editable={false}
      />

      <Field
        state={state}
        name="dob"
        isDate
        label={t("DetailsPage.dob")}
        control={(props) => <DatePicker {...props} />}
        editable={false}
      />

      <DataNode label={t("DetailsPage.sex")} variant={variant}>
        {defaultValues?.sex && sexDisplayFormat[defaultValues.sex]}
      </DataNode>
      <Field
        state={state}
        name="weightOnBirth"
        label={t("DetailsPage.birth-weight")}
        control={(props) => <Input {...props} endDecorator="kg" />}
        editable={false}
      />
      <p className="typo-h5 mt-5">{t("DetailsPage.place-of-birth")}</p>
      {placeOfBirthLocation !== "OTHER" && (
        <>
          <Field
            state={state}
            name="healthInstitution"
            label={t("DetailsPage.health-institution")}
            control={(props) => (
              <SearchInput {...props} options={healthInstitutionsOptions} />
            )}
            editable={false}
          />
        </>
      )}

      {placeOfBirthLocation === "OTHER" && (
        <>
          <input type="hidden" name="healthInstitution" value="OTHER" />
          <Field
            state={state}
            name="birthSublocation"
            label={t("DetailsPage.sublocation")}
            control={(props) => <Input {...props} />}
            editable={false}
          />
          <Field
            state={state}
            name="birthSublocationDistrict"
            label={t("DetailsPage.district")}
            control={(props) => <Input {...props} />}
            editable={false}
          />
        </>
      )}
    </DataBlock>
  );
};
