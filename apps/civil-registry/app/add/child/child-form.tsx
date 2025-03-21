"use client";

import { IconPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import React, { useState, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
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
import {
  multiChildSchema,
  type MultiChildSchema,
} from "@/app/add/child/child-schema";
import { FormWrap } from "@/app/add/form-wrap";
import { generateUUID, healthInstitutionsOptions } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";

export interface ChildFormProps {
  id: string;
  defaultValues: Partial<Person>[];
}

export const ChildForm: FC<ChildFormProps> = ({ id, defaultValues }) => {
  const t = useTranslations();
  const [state, formAction, isPending] = useForm<
    typeof multiChildSchema,
    MultiChildSchema
  >(childAction, multiChildSchema, {
    children: defaultValues,
  } as MultiChildSchema);

  const [children, setChildren] = useState<Partial<Person>[]>(defaultValues);

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

  const [placeOfBirthLocation, setPlaceOfBirthLocation] = useState<
    Record<number, string>
  >(() =>
    defaultValues.reduce(
      (acc, child, index) => {
        acc[index] = child.healthInstitution ?? "";
        return acc;
      },
      {} as Record<number, string>,
    ),
  );

  const addChild = () => {
    const newId = generateUUID();
    setChildren((_prev) => [
      ..._prev,
      {
        id: newId,
        firstName: undefined,
        middleName: undefined,
        natureOfBirth: undefined,
        dob: undefined,
        sex: undefined,
        weightOnBirth: undefined,
        healthInstitution: undefined,
        birthSublocation: undefined,
        birthSublocationDistrict: undefined,
      } as Partial<Person>,
    ]);
  };

  const removeChild = (id: string) => {
    setChildren((_prev) => _prev.filter((child) => child.id !== id));
  };

  return (
    <FormWrap action={formAction} cancelUrl="/" className="space-y-4">
      <>
        {children?.map((child, childIndex) => (
          <div key={childIndex}>
            <input
              type="hidden"
              name={`children.${childIndex}.id`}
              value={child.id}
            />
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
                name={`children.${childIndex}.natureOfBirth`}
                required
                state={state}
              />

              <Field
                state={state}
                name={`children.${childIndex}.firstName`}
                label={t("DetailsPage.first-name")}
                control={(props) => <Input {...props} />}
                required
              />

              <Field
                state={state}
                name={`children.${childIndex}.middleName`}
                label={t("DetailsPage.middle-name")}
                control={(props) => <Input {...props} />}
              />

              <Field
                state={state}
                name={`children.${childIndex}.dob`}
                isDate
                label={t("DetailsPage.dob")}
                control={(props) => <DatePicker {...props} />}
                required
              />

              <>
                <DataNode
                  label={t("DetailsPage.sex")}
                  variant={variant}
                  required
                />
                <ButtonGroup
                  name={`children.${childIndex}.sex`}
                  onValueChange={() => {}}
                  type="single"
                  defaultValue={defaultValues?.[childIndex]?.sex}
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
                name={`children.${childIndex}.weightOnBirth`}
                label={t("DetailsPage.birth-weight")}
                control={(props) => <Input {...props} endDecorator="kg" />}
                required
              />
              <p className="typo-h5 mt-5">{t("DetailsPage.place-of-birth")}</p>
              {placeOfBirthLocation[childIndex] !== "OTHER" && (
                <>
                  <Field
                    state={state}
                    name={`children.${childIndex}.healthInstitution`}
                    label={t("DetailsPage.health-institution")}
                    control={(props) => (
                      <SearchInput
                        {...props}
                        options={healthInstitutionsOptions}
                      />
                    )}
                    required
                  />
                  <div className={cn("flex justify-center underline")}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPlaceOfBirthLocation((prev) => ({
                          ...prev,
                          [childIndex]: "OTHER",
                        }));
                      }}
                    >
                      {t(
                        "DetailsPage.birth-happened-at-home-or-different-location",
                      )}
                    </a>
                  </div>
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
                    required
                  />
                  <Field
                    state={state}
                    name={`children.${childIndex}.birthSublocationDistrict`}
                    label={t("DetailsPage.district")}
                    control={(props) => <Input {...props} />}
                    required
                  />
                  <div className={cn("flex justify-center underline")}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPlaceOfBirthLocation((prev) => ({
                          ...prev,
                          [childIndex]: "",
                        }));
                      }}
                    >
                      {t("DetailsPage.birth-happened-at-health-institution")}
                    </a>
                  </div>
                </>
              )}
            </DataBlock>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="default"
          onClick={addChild}
        >
          <IconPlus /> {t("DetailsPage.add-another-child")}
        </Button>
      </>
    </FormWrap>
  );
};
