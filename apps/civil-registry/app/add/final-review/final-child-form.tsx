"use client";

import { useTranslations } from "next-intl";
import { type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { childAction } from "@/app/add/child/child-action";
import {
  multiChildSchema,
  type MultiChildSchema,
} from "@/app/add/child/child-schema";
import { healthInstitutionsOptions } from "@/lib/data/dummy-data";

type Child = MultiChildSchema["children"][number];

export interface FinalChildFormProps {
  defaultValues: Partial<Child>[];
}

export const FinalChildForm: FC<FinalChildFormProps> = ({ defaultValues }) => {
  const t = useTranslations();
  const [state] = useForm(childAction, multiChildSchema, {
    children: defaultValues,
  });

  const sexDisplayFormat = {
    M: t("DetailsPage.male"),
    F: t("DetailsPage.female"),
    I: t("DetailsPage.intersex"),
  };

  const placeOfBirthLocation = defaultValues.reduce(
    (acc, child, index) => {
      acc[index] = child.healthInstitution ?? "";
      return acc;
    },
    {} as Record<number, string>,
  );

  return defaultValues?.map((child, childIndex) => (
    <div key={childIndex}>
      <DataBlock
        title={t(`DetailsPage.title-child`)}
        disabled={undefined}
        active={undefined}
        toggleEdit={undefined}
        description="As registered at birth in the birth notification"
      >
        <Field
          control={(props) => (
            <RadioGroup {...props} orientation="horizontal" size="md" />
          )}
          label={t("DetailsPage.nature-of-birth")}
          name={`children.${childIndex}.natureOfBirth`}
          state={state}
          editable={false}
        />

        <Field
          state={state}
          name={`children.${childIndex}.firstName`}
          label={t("DetailsPage.first-name")}
          control={(props) => <Input {...props} />}
          editable={false}
        />

        <Field
          state={state}
          name={`children.${childIndex}.middleName`}
          label={t("DetailsPage.middle-name")}
          control={(props) => <Input {...props} />}
          editable={false}
        />

        <Field
          state={state}
          name={`children.${childIndex}.dob`}
          isDate
          label={t("DetailsPage.dob")}
          control={(props) => <DatePicker {...props} />}
          editable={false}
        />

        <DataNode label={t("DetailsPage.sex")}>
          {child.sex && sexDisplayFormat[child.sex]}
        </DataNode>
        <Field
          state={state}
          name={`children.${childIndex}.weightOnBirth`}
          label={t("DetailsPage.birth-weight")}
          control={(props) => <Input {...props} endDecorator="kg" />}
          editable={false}
        />
        <p className="typo-h5 mt-5">{t("DetailsPage.place-of-birth")}</p>
        {placeOfBirthLocation[childIndex] !== "OTHER" && (
          <>
            <Field
              state={state}
              name={`children.${childIndex}.healthInstitution`}
              label={t("DetailsPage.health-institution")}
              control={(props) => (
                <SearchInput {...props} options={healthInstitutionsOptions} />
              )}
              editable={false}
            />
          </>
        )}

        {placeOfBirthLocation[childIndex] === "OTHER" && (
          <>
            <input
              type="hidden"
              name={`children.${childIndex}.healthInstitution`}
              value="OTHER"
            />
            <Field
              state={state}
              name={`children.${childIndex}.birthSublocation`}
              label={t("DetailsPage.sublocation")}
              control={(props) => <Input {...props} />}
              editable={false}
            />
            <Field
              state={state}
              name={`children.${childIndex}.birthSublocationDistrict`}
              label={t("DetailsPage.district")}
              control={(props) => <Input {...props} />}
              editable={false}
            />
          </>
        )}
      </DataBlock>
    </div>
  ));
};
