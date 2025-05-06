"use client";

import { IconCaretDownFilled } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState, type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";
import { cn } from "@workspace/ui/lib/utils";

import { FormWrap } from "@/app/add/form-wrap";
import { motherAction } from "@/app/add/mother/mother-action";
import {
  motherSchema,
  type MotherSchema,
} from "@/app/add/mother/mother-schema";
import { ContactFields } from "@/components/contact-fields";
import { NationalIdFields } from "@/components/national-id-fields";
import { usePersonNationalIdStatus } from "@/hooks/usePersonNationalIdStatus";
import { dummyCounties, educationOptions } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";

export interface MotherFormProps {
  id: string;
  defaultValues?: Partial<
    MotherSchema & { father?: string | Person; mother?: string | Person }
  >;
}

export const MotherForm: FC<MotherFormProps> = ({ id, defaultValues }) => {
  const t = useTranslations();

  const [state, formAction, isPending] = useForm(
    motherAction,
    motherSchema,
    defaultValues,
  );

  const { isNationalIdUnknown } = usePersonNationalIdStatus();

  const [chosenCounty, setChosenCounty] = useState(
    state.values?.residenceCounty,
  );

  const marriedOptions = [
    { label: t("DetailsPage.married"), value: "Married" },
    { label: t("DetailsPage.divorced"), value: "Divorced" },
    { label: t("DetailsPage.single"), value: "Single" },
    { label: t("DetailsPage.widowed"), value: "Widowed" },
  ];

  return (
    <FormWrap
      action={formAction}
      isPending={isPending}
      prevUrl="/add/child"
      className="space-y-4"
    >
      <input type="hidden" name="id" value={id} />
      <DataBlock
        title={t(`DetailsPage.title-mother`)}
        disabled={undefined}
        active={undefined}
        toggleEdit={undefined}
      >
        <NationalIdFields searchSexFilter="F" state={state} />

        <Field
          state={state}
          control={(props) => (
            <RadioGroup
              {...props}
              orientation="vertical"
              size="md"
              options={marriedOptions}
            />
          )}
          label={t("DetailsPage.marital-status")}
          name="maritalStatus"
          required
        />

        <Field
          state={state}
          name="education"
          label={t("DetailsPage.education")}
          control={(props) => (
            <SearchInput
              {...props}
              options={educationOptions}
              placeholder={t("FormPlaceholders.select")}
              endDecorator={<IconCaretDownFilled />}
            />
          )}
          required={false}
        />

        <Field
          state={state}
          name="fatherName"
          label={t("DetailsPage.fathers-name")}
          control={(props) => (
            <Input {...props} placeholder={t("FormPlaceholders.fathersName")} />
          )}
          required={false}
        />

        <ContactFields state={state} />

        <p className="typo-h5 mt-5">{t("DetailsPage.usual-residence")}</p>

        <Field
          state={state}
          name="residenceCounty"
          label={t("DetailsPage.subcounty")}
          required
          control={(props) => (
            <SearchInput
              {...props}
              onValueChange={setChosenCounty}
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
          name="residenceSublocation"
          label={t("DetailsPage.select-sublocation")}
          required
          control={(props) => (
            <SearchInput
              {...props}
              placeholder={t("DetailsPage.choose-or-search")}
              options={dummyCounties
                .find((county) => county.name === chosenCounty)
                ?.constituencies.map((c) => ({
                  label: c,
                  value: c,
                }))}
            />
          )}
        />

        <Field
          state={state}
          name="residenceDistrict"
          label={t("DetailsPage.estate")}
          control={(props) => <Input {...props} />}
          required
        />
      </DataBlock>
    </FormWrap>
  );
};
