"use client";

import { IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useState, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Select } from "@workspace/ui/components/select";
import { useForm } from "@workspace/ui/hooks/use-form";

import { childAction } from "@/app/add/child/child-action";
import {
  multiChildSchema,
  type MultiChildSchema,
} from "@/app/add/child/child-schema";
import { FormWrap } from "@/app/add/form-wrap";
import {
  dummyCounties,
  generateUUID,
  healthInstitutionsOptions,
} from "@/lib/data/dummy-data";
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

  const [chosenHealthCounty, setChosenHealthCounty] = useState<
    Record<number, string>
  >(() =>
    defaultValues.reduce(
      (acc, child, index) => {
        acc[index] = child.healthInstitutionCounty ?? "";
        return acc;
      },
      {} as Record<number, string>,
    ),
  );

  const [chosenBirthCounty, setChosenBirthCounty] = useState<
    Record<number, string>
  >(() =>
    defaultValues.reduce(
      (acc, child, index) => {
        acc[index] = child.birthCounty ?? "";
        return acc;
      },
      {} as Record<number, string>,
    ),
  );

  const [birthHappenedAtHome, setBirthHappenedAtHome] = useState<
    Record<number, string>
  >(() =>
    defaultValues.reduce(
      (acc, child, index) => {
        acc[index] = child.birthHappenedAtHome ?? "No";
        return acc;
      },
      {} as Record<number, string>,
    ),
  );

  const [healthInstitution, setHealthInstitution] = useState<
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

  const [birthDate, setBirthDate] = useState<Record<number, string>>(() =>
    defaultValues.reduce(
      (acc, child, index) => {
        acc[index] = child.dob ?? "";
        return acc;
      },
      {} as Record<number, string>,
    ),
  );

  const [birthSublocation, setBirthSublocation] = useState<
    Record<number, string>
  >(() =>
    defaultValues.reduce(
      (acc, child, index) => {
        acc[index] = child.dob ?? "";
        return acc;
      },
      {} as Record<number, string>,
    ),
  );
  const [birthSublocationDistrict, setBirthSublocationDistrict] = useState<
    Record<number, string>
  >(() =>
    defaultValues.reduce(
      (acc, child, index) => {
        acc[index] = child.dob ?? "";
        return acc;
      },
      {} as Record<number, string>,
    ),
  );

  const [typeOfBirth, setTypeOfBirth] = useState<string>("Single");
  const [totalChildren, setTotalChildren] = useState<number>(1);

  const addChild = (disablePrevious: boolean) => {
    const firstChild = state?.values?.children?.[0] ?? null;
    const newChild: Partial<Person> = {
      abandoned: false,
      id: generateUUID(),
      firstName: undefined,
      middleName: undefined,
      natureOfBirth: undefined,
      dob: firstChild ? birthDate[0] : "",
      sex: undefined,
      weightOnBirth: "",
      birthHappenedAtHome: firstChild ? birthHappenedAtHome[0] : "",
      healthInstitutionCounty: firstChild ? chosenHealthCounty[0] : "",
      healthInstitution: firstChild ? healthInstitution[0] : "",
      birthCounty: firstChild ? chosenBirthCounty[0] : "",
      birthSublocation: firstChild ? birthSublocation[0] : "",
      birthSublocationDistrict: firstChild ? birthSublocationDistrict[0] : "",
    };

    setBirthHappenedAtHome((prev) => ({
      ...prev,
      [Object.keys(prev).length]: birthHappenedAtHome[0] ?? "No",
    }));
    setHealthInstitution((prev) => ({
      ...prev,
      [Object.keys(prev).length]: healthInstitution[0] ?? "",
    }));
    setChosenHealthCounty((prev) => ({
      ...prev,
      [Object.keys(prev).length]: chosenHealthCounty[0] ?? "",
    }));
    setChosenBirthCounty((prev) => ({
      ...prev,
      [Object.keys(prev).length]: chosenBirthCounty[0] ?? "",
    }));
    setBirthSublocation((prev) => ({
      ...prev,
      [Object.keys(prev).length]: birthSublocation[0] ?? "",
    }));
    setBirthSublocationDistrict((prev) => ({
      ...prev,
      [Object.keys(prev).length]: birthSublocationDistrict[0] ?? "",
    }));

    state?.values?.children?.push(
      newChild as unknown as (typeof state.values.children)[number],
    );

    if (disablePrevious) {
      setChildren([newChild]);
    } else {
      setChildren((_prev) => [..._prev, newChild]);
    }
  };

  useEffect(() => {
    if (defaultValues.length === 0) {
      addChild(true);
    }
  }, [defaultValues]);

  //   useEffect(() => {
  //     console.log(state.errors);
  //   }, [state]);

  type DataVariant = "default" | "disabled";
  const variant: DataVariant = "default";

  const natureOfBirthOptions = [
    { label: t("DetailsPage.live-birth"), value: "LiveBirth" },
    { label: t("DetailsPage.stillbirth"), value: "StillBirth" },
  ];
  const birthHappenedOptions = [
    { label: t("DetailsPage.yes"), value: "Yes" },
    {
      label: t("DetailsPage.no"),
      value: "No",
    },
  ];

  const sexOptions = [
    { label: t("DetailsPage.male"), value: "M" },
    { label: t("DetailsPage.female"), value: "F" },
    { label: t("DetailsPage.intersex"), value: "I" },
  ];

  const typeOfBirthOptions = [
    { label: t("DetailsPage.single"), value: "Single" },
    {
      label: t("DetailsPage.twin"),
      value: "Twin",
    },
    {
      label: t("DetailsPage.other"),
      value: "Other",
    },
  ];

  const removeChild = (id: string | undefined) => {
    if (!id) {
      return;
    }

    setChildren((prev) => prev.filter((child) => child.id !== id));
  };

  const handleHealthCountyChange = useCallback(
    (childIndex: number, value: string | undefined) => {
      setChosenHealthCounty((prev) => {
        const prevValue = prev[childIndex] ?? "";
        if (prevValue === (value ?? "")) return prev;
        return {
          ...prev,
          [childIndex]: value ?? "",
        };
      });
    },
    [],
  );

  const handleBirthCountyChange = useCallback(
    (childIndex: number, value: string | undefined) => {
      setChosenBirthCounty((prev) => {
        const prevValue = prev[childIndex] ?? "";
        if (prevValue === (value ?? "")) return prev;
        return {
          ...prev,
          [childIndex]: value ?? "",
        };
      });
    },
    [],
  );

  const handleHealthInstitutionChange = useCallback(
    (childIndex: number, value: string | undefined) => {
      setHealthInstitution((prev) => {
        const prevValue = prev[childIndex] ?? "";
        if (prevValue === (value ?? "")) return prev;
        return {
          ...prev,
          [childIndex]: value ?? "",
        };
      });
    },
    [],
  );

  const handleSublocationChange = useCallback(
    (childIndex: number, value: string | undefined) => {
      setBirthSublocation((prev) => {
        const prevValue = prev[childIndex] ?? "";
        if (prevValue === (value ?? "")) return prev;
        return {
          ...prev,
          [childIndex]: value ?? "",
        };
      });
    },
    [],
  );

  const handleBirthDateChange = useCallback(
    (childIndex: number, value: string) => {
      setBirthDate((prev) => {
        const prevValue = prev[childIndex] ?? "";
        if (prevValue === (value ?? "")) return prev;
        return {
          ...prev,
          [childIndex]: value ?? "",
        };
      });
    },
    [],
  );

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
              state={state}
              name={`children.${childIndex}.abandoned`}
              control={(props) => (
                <Checkbox {...props}>{t("DetailsPage.is-abandoned")}</Checkbox>
              )}
            />
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
              control={(props) => (
                <DatePicker
                  {...props}
                  onValueChange={(value) =>
                    handleBirthDateChange(
                      childIndex,
                      value?.toDateString() ?? "",
                    )
                  }
                />
              )}
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
            <Field
              control={(props) => {
                return (
                  <RadioGroup
                    {...props}
                    options={birthHappenedOptions}
                    onValueChange={(value) => {
                      setBirthHappenedAtHome((prev) => {
                        prev[childIndex] = value;
                        return { ...prev };
                      });
                    }}
                    defaultValue={birthHappenedAtHome[childIndex]}
                    orientation="horizontal"
                    size="md"
                    color="civilRegistry"
                  />
                );
              }}
              label={t("DetailsPage.birth-happened-at-home")}
              name={`children.${childIndex}.birthHappenedAtHome`}
              required
              state={state}
            />
            {birthHappenedAtHome[childIndex] !== "Yes" && (
              <>
                <Field
                  state={state}
                  name={`children.${childIndex}.healthInstitutionCounty`}
                  label={t("DetailsPage.county")}
                  required
                  control={(props) => (
                    <SearchInput
                      {...props}
                      placeholder={t("DetailsPage.choose-or-search")}
                      options={dummyCounties.map((county) => ({
                        label: county.name,
                        value: county.name,
                      }))}
                      onValueChange={(value) =>
                        handleHealthCountyChange(childIndex, value)
                      }
                    />
                  )}
                />
                <Field
                  state={state}
                  name={`children.${childIndex}.healthInstitution`}
                  label={t("DetailsPage.health-institution")}
                  control={(props) => (
                    <SearchInput
                      {...props}
                      options={healthInstitutionsOptions}
                      onValueChange={(value) =>
                        handleHealthInstitutionChange(childIndex, value)
                      }
                    />
                  )}
                  required
                />
              </>
            )}

            {birthHappenedAtHome[childIndex] === "Yes" && (
              <>
                <Field
                  state={state}
                  name={`children.${childIndex}.birthCounty`}
                  label={t("DetailsPage.county")}
                  required
                  control={(props) => (
                    <SearchInput
                      {...props}
                      onValueChange={(value) =>
                        handleBirthCountyChange(childIndex, value)
                      }
                      placeholder={t("DetailsPage.choose-or-search")}
                      options={dummyCounties.map((county) => ({
                        label: county.name,
                        value: county.name,
                      }))}
                    />
                  )}
                />

                <Field
                  state={state}
                  name={`children.${childIndex}.birthSublocation`}
                  label={t("DetailsPage.select-sublocation")}
                  required
                  control={(props) => (
                    <SearchInput
                      {...props}
                      placeholder={t("DetailsPage.choose-or-search")}
                      options={dummyCounties
                        .find(
                          (county) =>
                            county.name === chosenBirthCounty[childIndex],
                        )
                        ?.constituencies.map((c) => ({
                          label: c,
                          value: c,
                        }))}
                      onValueChange={(value) =>
                        handleSublocationChange(childIndex, value)
                      }
                    />
                  )}
                />
                {/* <Field
                  state={state}
                  name={`children.${childIndex}.birthSublocation`}
                  label={t("DetailsPage.sublocation")}
                  control={(props) => <Input {...props} />}
                  required
                /> */}
                <Field
                  state={state}
                  name={`children.${childIndex}.birthSublocationDistrict`}
                  label={t("DetailsPage.estate-and-town")}
                  control={(props) => (
                    <Input
                      {...props}
                      onValueChange={(value) => {
                        setBirthSublocationDistrict((prev) => {
                          prev[childIndex] = value;
                          return { ...prev };
                        });
                      }}
                    />
                  )}
                  required
                />
              </>
            )}
          </DataBlock>
        </div>
      ))}
      <Field
        control={(props) => {
          return (
            <RadioGroup
              {...props}
              options={typeOfBirthOptions}
              onValueChange={(value) => {
                if (value === "Single") {
                  if (totalChildren > 1) {
                    const _children = state?.values?.children ?? [];
                    // Keep only the first child
                    const childrenToRemove = _children.slice(1); // all except the first

                    childrenToRemove.forEach((child) => {
                      removeChild(child.id);
                    });
                  }
                  setTotalChildren(1);
                } else if (value === "Twin") {
                  if (totalChildren > 2) {
                    const _children = state?.values?.children ?? [];
                    // Keep only the first two children
                    const childrenToRemove = _children.slice(2); // all except the first two
                    childrenToRemove.forEach((child) => {
                      removeChild(child.id);
                    });
                  } else if (totalChildren === 1) {
                    addChild(false);
                  }
                  setTotalChildren(2);
                } else {
                  const currentChildren = state?.values?.children ?? [];
                  const childrenToAdd = 3 - currentChildren.length;
                  for (let i = 0; i < childrenToAdd; i++) {
                    addChild(false);
                  }
                  setTotalChildren(totalChildren < 3 ? 3 : totalChildren);
                }

                setTypeOfBirth(value);
              }}
              orientation="horizontal"
              size="md"
              color="civilRegistry"
              defaultValue={typeOfBirth}
            />
          );
        }}
        label={t("DetailsPage.type-of-birth")}
        name="typeOfBirth"
      />
      {typeOfBirth === "Other" && (
        <Field
          name="totalChildren"
          label={t("DetailsPage.total-children-count")}
          control={(props) => (
            <Select
              options={[...Array(8)].map((_, i) => ({
                label: String(i + 3),
                value: String(i + 3),
              }))}
              onValueChange={(value) => {
                const newTotal = Number(value);
                const currentChildren = state?.values?.children ?? [];

                if (newTotal < currentChildren.length) {
                  // Remove extra children
                  const childrenToRemove = currentChildren.slice(newTotal);
                  childrenToRemove.forEach((child) => removeChild(child.id));
                } else if (newTotal > currentChildren.length) {
                  // Add missing children
                  const childrenToAdd = newTotal - currentChildren.length;
                  for (let i = 0; i < childrenToAdd; i++) {
                    addChild(false);
                  }
                }

                setTotalChildren(newTotal);
              }}
              value={totalChildren < 3 ? "3" : String(totalChildren)}
              {...props}
            />
          )}
        />
      )}
      {/* <div className="flex justify-center">
        <Button
          type="button"
          variant="secondary"
          size="default"
          onClick={() => addChild(false)}
        >
          <IconPlus /> {t("DetailsPage.add-another-child")}
        </Button>
      </div> */}
    </FormWrap>
  );
};
