"use client";

import { useTranslations } from "next-intl";
import { useState, type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { applicantAction } from "@/app/apply/[id]/applicant/applicant-action";
import {
  applicantSchema,
  dummyCounties,
  type ApplicantSchema,
} from "@/app/apply/[id]/applicant/applicant-schema";
import { DisabilitiesFields } from "@/app/apply/[id]/applicant/disabilities-fields";
import { IdTypeFields } from "@/app/apply/[id]/applicant/id-type-fields";
import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { PhoneNumbersField } from "@/app/apply/[id]/phone-numbers-field";

export interface ApplicantFormProps {
  id: string;
  defaultValues?: Partial<ApplicantSchema>;
}

export const ApplicantForm: FC<ApplicantFormProps> = ({
  id,
  defaultValues,
}) => {
  const t = useTranslations("ApplicantForm");

  const [state, formAction, isPending] = useForm(
    applicantAction,
    applicantSchema,
    defaultValues,
  );

  const [chosenCounty, setChosenCounty] = useState(
    state.values?.applicant_county,
  );

  return (
    <ApplyFormWrap
      action={formAction}
      isPending={isPending}
      cancelUrl="/dashboard"
      className="space-y-4"
    >
      <ApplyFormSubtitle>{t("applicantInfo")}</ApplyFormSubtitle>
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
          <SearchInput
            {...props}
            onValueChange={setChosenCounty}
            placeholder={t("chooseOrSearch")}
            options={dummyCounties.map((county) => ({
              label: county.name,
              value: county.name,
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
          <SearchInput
            {...props}
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
        control={(props) => <Input placeholder={t("enterWard")} {...props} />}
      />
    </ApplyFormWrap>
  );
};
