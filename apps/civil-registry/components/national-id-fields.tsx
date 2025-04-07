"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, type FC } from "react";

import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, type FormFieldState } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";

import { UnderlineButton } from "@/components/underline-button";
import { usePersonSearch } from "@/hooks/usePersonSearch";
import type { SexType } from "@/lib/data/person";
import { nationalityOptions } from "@/lib/util/nationalities";

export interface NationalIdFieldProps {
  searchSexFilter?: SexType;

  state: FormFieldState<{
    nationalId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    dob: string;
    citizenship: string;
    passportNumber: string;
    nationality: string;
  }>;
  editable?: boolean;
}

export const NationalIdFields: FC<NationalIdFieldProps> = ({
  searchSexFilter,
  state,
  editable = true,
}) => {
  const t = useTranslations("DetailsPage");
  const format = useFormatter();
  const personSearch = usePersonSearch(searchSexFilter);

  const [hasNationalId, setHasNationalId] = useState(
    state.values?.nationalId !== "",
  );

  const [firstName, setFirstName] = useState(state.values?.firstName ?? "");
  const [lastName, setLastName] = useState(state.values?.lastName ?? "");
  const [middleName, setMiddleName] = useState(state.values?.middleName ?? "");
  const [birthDate, setBirthDate] = useState(state.values?.dob ?? "");
  const [citizenship, setCitizenship] = useState(
    state.values?.citizenship ?? "–",
  );

  const fullName =
    [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "–";

  return (
    <>
      {hasNationalId ? (
        <Field
          state={state}
          name="nationalId"
          label={t("national-id")}
          editable={editable}
          control={(props) => (
            <SearchInput
              {...props}
              isLoading={personSearch.isLoading}
              onValueChange={personSearch.onValueChange}
              options={personSearch.options}
              onValueSelect={(value) => {
                const person = personSearch.findByNationalId(value);

                setFirstName(person?.firstName ?? "");
                setLastName(person?.lastName ?? "");
                setMiddleName(person?.middleName ?? "");
                setBirthDate(person?.dob ?? "");
                setCitizenship(person?.citizenship ?? "–");
              }}
            />
          )}
          required
        />
      ) : (
        <input type="hidden" name="nationalId" value="" />
      )}

      {editable &&
        (hasNationalId ? (
          <UnderlineButton
            className="mx-auto"
            onClick={() => setHasNationalId(false)}
          >
            {t("national-id-unknown")}
          </UnderlineButton>
        ) : (
          <UnderlineButton
            className="mx-auto"
            onClick={() => setHasNationalId(true)}
          >
            <IconChevronLeft /> {t("back-to-national-id-search")}
          </UnderlineButton>
        ))}

      {hasNationalId ? (
        <>
          <DataNode label={t("name")} variant="default">
            <input type="hidden" name="firstName" value={firstName} />
            <input type="hidden" name="middleName" value={middleName} />
            <input type="hidden" name="lastName" value={lastName} />

            {fullName}
          </DataNode>
          <DataNode label={t("dob")} variant="default">
            <input type="hidden" name="dob" value={birthDate} />

            {birthDate ? format.dateTime(new Date(birthDate)) : "–"}
          </DataNode>

          <DataNode label={t("dob")} variant="default">
            <input type="hidden" name="citizenship" value={citizenship} />

            {citizenship ?? "–"}
          </DataNode>
        </>
      ) : (
        <>
          <Field
            state={state}
            name="firstName"
            label={t("first-name")}
            control={(props) => <Input {...props} />}
            editable={editable}
            required
          />

          <Field
            state={state}
            name="middleName"
            label={t("middle-name")}
            control={(props) => <Input {...props} />}
            editable={editable}
          />

          <Field
            state={state}
            name="lastName"
            label={t("lastname")}
            control={(props) => <Input {...props} />}
            editable={editable}
            required
          />

          <Field
            state={state}
            name="passportNumber"
            label={t("passport-number")}
            control={(props) => <Input {...props} />}
            editable={editable}
            required
          />
          <Field
            state={state}
            name="dob"
            isDate
            label={t("dob")}
            editable={editable}
            control={(props) => <DatePicker {...props} />}
          />

          <Field
            state={state}
            name="citizenship"
            label={t("citizenship")}
            editable={editable}
            control={(props) => <Input {...props} />}
          />
        </>
      )}

      <Field
        state={state}
        name="nationality"
        label={t("nationality")}
        editable={editable}
        control={(props) => (
          <SearchInput {...props} options={nationalityOptions} />
        )}
        required
      />
    </>
  );
};
