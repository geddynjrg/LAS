"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { Combobox } from "@workspace/ui/components/combobox";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { applicantAction } from "@/app/apply/[id]/applicant/applicant-action";
import {
  applicantSchema,
  dummyCounties,
  type ApplicantSchema,
} from "@/app/apply/[id]/applicant/applicant-schema";
import { DisabilitiesFields } from "@/app/apply/[id]/applicant/disabilities-fields";
import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { IdTypeFields } from "@/app/apply/[id]/id-type-fields";
import { PhoneNumbersField } from "@/app/apply/[id]/phone-numbers-field";
import { useCountrySubdivisions } from "@/hooks/useCountySubDivisions";
import { clientApi } from "@/lib/api/client-api";

export interface ApplicantFormProps {
  id: string;
  counties?: { id?: number; name?: string }[];
  defaultValues?: Partial<ApplicantSchema>;
}

export const ApplicantForm: FC<ApplicantFormProps> = ({
  id,
  counties,
  defaultValues,
}) => {
  const t = useTranslations("ApplyForm");

  const [state, formAction, isPending] = useForm(
    applicantAction,
    applicantSchema,
    defaultValues,
  );

  const [chosenCounty, setChosenCounty] = useState(
    state.values?.applicant_county,
  );

  const chosenCountyId = counties?.find(
    (county) => county.name === chosenCounty,
  )?.id;

  const [subdivisions, subDivisionsLoading] =
    useCountrySubdivisions(chosenCountyId);

  return (
    <ApplyFormWrap
      action={formAction}
      isPending={isPending}
      cancelUrl="/dashboard"
      className="space-y-4"
    >
      <ApplyFormSubtitle>{t("applicantTitle")}</ApplyFormSubtitle>
      <input type="hidden" name="id" value={id} />

      {!state.success && state.message && (
        <Alert variant="error">{state.message}</Alert>
      )}

      <Field
        state={state}
        name="applicant_first_name"
        label={t("firstName")}
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="applicant_middle_name"
        label={t("middleName")}
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="applicant_surname"
        label={t("surname")}
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="applicant_sex"
        label={t("sex")}
        required
        control={(props) => (
          <ButtonGroup {...props} type="single">
            <ButtonGroupItem value="male">{t("male")}</ButtonGroupItem>
            <ButtonGroupItem value="female">{t("female")}</ButtonGroupItem>
            <ButtonGroupItem value="intersex">{t("intersex")}</ButtonGroupItem>
          </ButtonGroup>
        )}
      />

      <Field
        state={state}
        name="applicant_date_of_birth"
        label={t("dateOfBirth")}
        required
        control={(props) => <DatePicker format="YYYY-MM-DD" {...props} />}
      />

      <IdTypeFields state={state} />

      <PhoneNumbersField state={state} />

      <Field
        state={state}
        name="applicant_email"
        label={t("email")}
        required
        control={(props) => <Input type="email" {...props} />}
      />

      <DisabilitiesFields state={state} />

      <ApplyFormSubtitle className="mt-8">{t("address")}</ApplyFormSubtitle>

      <Field
        state={state}
        name="applicant_county"
        label="County"
        required
        control={(props) => (
          <Combobox
            {...props}
            onValueChange={(value) => {
              setChosenCounty(value);
            }}
            placeholder={t("chooseOrSearch")}
            options={counties?.map((county) => ({
              label: county.name ?? "",
              value: county.name ?? "",
            }))}
          />
        )}
      />

      <Field
        state={state}
        name="applicant_subcounty"
        label={t("subCounty")}
        required
        control={(props) => (
          <Combobox
            {...props}
            disabled={!chosenCounty}
            placeholder={t("chooseOrSearch")}
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
        name="applicant_ward"
        label={t("ward")}
        required
        control={(props) => (
          <Input
            placeholder={t("enterWard")}
            disabled={!chosenCounty}
            {...props}
          />
        )}
      />
    </ApplyFormWrap>
  );
};
