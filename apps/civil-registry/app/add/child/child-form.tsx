"use client";

import { IconPlus, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState, type FC } from "react";

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
  defaultValues: Partial<Person>[];
}

export const ChildForm: FC<ChildFormProps> = ({ defaultValues }) => {
  const t = useTranslations();
  const [state, formAction, isPending] = useForm<
    typeof multiChildSchema,
    MultiChildSchema
  >(childAction, multiChildSchema, {
    children: defaultValues,
  } as MultiChildSchema);
  const [children, setChildren] = useState<Partial<Person>[]>(defaultValues);

  const addChild = (disablePrevious: boolean) => {
    const newChild = {
      id: generateUUID(),
      firstName: undefined,
      middleName: undefined,
      natureOfBirth: undefined,
      dob: undefined,
      sex: undefined,
      weightOnBirth: undefined,
      healthInstitution: undefined,
      birthSublocation: undefined,
      birthSublocationDistrict: undefined,
    } as Partial<Person>;

    setChildren((_prev) =>
      disablePrevious ? [newChild] : [..._prev, newChild],
    );
  };

  useEffect(() => {
    if (defaultValues.length === 0) {
      addChild(true);
    }
  }, [defaultValues]);

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

  const removeChild = (id: string | undefined) => {
    if (!id) {
      return;
    }

    setChildren((prev) => prev.filter((child) => child.id !== id));
  };

  return (
    <FormWrap action={formAction} isPending={isPending} className="space-y-4">
      {children?.map((child, childIndex) => (
        <div key={child.id} className="relative">
          <input
            type="hidden"
            name={`children.${childIndex}.id`}
            value={child.id}
          />
          {childIndex > 0 && (
            <Button
              variant="ghost"
              type="button"
              className="z-1 absolute right-0 top-1 px-1 py-0"
              onClick={() => removeChild(child.id)}
            >
              <IconX size={18} />
            </Button>
          )}
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
                    color="civilRegistry"
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
              description={t("Common.optional")}
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
                className="flex w-full justify-start gap-2"
              >
                <React.Fragment key=".0">
                  {sexOptions.map((option) => (
                    <ButtonGroupItem
                      key={option.value}
                      value={option.value}
                      enableIcon={false}
                      className="flex-1 px-[10px] text-center"
                    >
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
      <div className="flex justify-center">
        <Button
          type="button"
          variant="secondary"
          size="default"
          onClick={() => addChild(false)}
        >
          <IconPlus /> {t("DetailsPage.add-another-child")}
        </Button>
      </div>
    </FormWrap>
  );
};
