"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useState, type FC } from "react";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";
import { cn } from "@workspace/ui/lib/utils";

import { childAction } from "@/app/add/child/child-action";
import { childSchema, type ChildSchema } from "@/app/add/child/child-schema";
import { FormWrap } from "@/app/add/form-wrap";
import { healthInstitutionsOptions } from "@/lib/data/dummy-data";

export interface ChildFormProps {
  id: string;
  defaultValues?: Partial<ChildSchema>;
}

export const ChildForm: FC<ChildFormProps> = ({ id, defaultValues }) => {
  const t = useTranslations();
  const [state, formAction, isPending] = useForm(
    childAction,
    childSchema,
    defaultValues,
  );
  type DataVariant = "default" | "disabled";
  const variant: DataVariant = "default";

  const natureOfBirthOptions = [
    { label: t("DetailsPage.live-birth"), value: "LiveBirth" },
    { label: t("DetailsPage.stillbirth"), value: "StillBirth" },
  ];

  const sexOptions = [
    { label: t("DetailsPage.male"), value: "M" },
    { label: t("DetailsPage.female"), value: "F" },
    { label: t("DetailsPage.intersex"), value: "I" },
  ];

  const [placeOfBirthLocation, setPlaceOfBirthLocation] = useState<string>(
    defaultValues?.healthInstitution ?? "",
  );

  return (
    <FormWrap action={formAction} cancelUrl="/dashboard" className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <DataBlock
        title={t(`DetailsPage.title-child`)}
        disabled={undefined}
        active={undefined}
        toggleEdit={undefined}
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
          required
          state={state}
        />

        <Field
          state={state}
          name="firstName"
          label={t("DetailsPage.first-name")}
          control={(props) => <Input {...props} />}
          required
        />

        <Field
          state={state}
          name="middleName"
          label={t("DetailsPage.middle-name")}
          control={(props) => <Input {...props} />}
        />

        <Field
          state={state}
          name="dob"
          isDate
          label={t("DetailsPage.dob")}
          control={(props) => <DatePicker {...props} />}
          required
        />

        <>
          <DataNode label={t("DetailsPage.sex")} variant={variant} required />
          <ButtonGroup
            name="sex"
            onValueChange={() => {}}
            type="single"
            defaultValue={defaultValues?.sex}
          >
            <React.Fragment key=".0">
              {sexOptions.map((option) => (
                <ButtonGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ButtonGroupItem>
              ))}
            </React.Fragment>
          </ButtonGroup>
        </>
        <Field
          state={state}
          name="weightOnBirth"
          label={t("DetailsPage.birth-weight")}
          control={(props) => <Input {...props} endDecorator="kg" />}
          required
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
              required
            />
            <div className={cn("flex justify-center underline")}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPlaceOfBirthLocation("OTHER");
                }}
              >
                {t("DetailsPage.birth-happened-at-home-or-different-location")}
              </a>
            </div>
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
              required
            />
            <Field
              state={state}
              name="birthSublocationDistrict"
              label={t("DetailsPage.district")}
              control={(props) => <Input {...props} />}
              required
            />
            <div className={cn("flex justify-center underline")}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPlaceOfBirthLocation("");
                }}
              >
                {t("DetailsPage.birth-happened-at-health-institution")}
              </a>
            </div>
          </>
        )}
      </DataBlock>
    </FormWrap>
  );
};
