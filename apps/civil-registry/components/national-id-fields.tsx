"use client";

import { IconCaretDownFilled, IconChevronLeft } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, type FC } from "react";

import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, type FormFieldState } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { isValueChanged } from "@workspace/ui/lib/utils";

import { UnderlineButton } from "@/components/underline-button";
import { usePersonNationalIdStatus } from "@/hooks/usePersonNationalIdStatus";
import { usePersonSearch } from "@/hooks/usePersonSearch";
import type { SexType } from "@/lib/data/person";
import { nationalityOptions } from "@/lib/util/nationalities";

interface NationalIdFieldValues {
  nationalId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  citizenship: string;
  passportNumber: string;
  nationality: string;
  isPredefinedId: string;
}

export interface NationalIdFieldProps {
  searchSexFilter?: SexType;
  state: FormFieldState<NationalIdFieldValues>;
  defaultValues?: Partial<NationalIdFieldValues>;
  editable?: boolean;
  nameWithDescriptions?: boolean;
}

export const NationalIdFields: FC<NationalIdFieldProps> = ({
  searchSexFilter,
  state,
  defaultValues,
  editable = true,
  nameWithDescriptions = false,
}) => {
  const t = useTranslations();
  const format = useFormatter();
  const personSearch = usePersonSearch(searchSexFilter);
  const { setIsNationalIdUnknown } = usePersonNationalIdStatus();

  const [hasNationalId, setHasNationalId] = useState(
    state.values?.nationalId !== "",
  );

  const [firstName, setFirstName] = useState(state.values?.firstName ?? "");
  const [middleName, setMiddleName] = useState(state.values?.middleName ?? "");
  const [lastName, setLastName] = useState(state.values?.lastName ?? "");
  const [dob, setDob] = useState(state.values?.dob ?? "");
  const [citizenship, setCitizenship] = useState(
    state.values?.citizenship ?? "–",
  );

  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const isNameChanged =
    !editable &&
    (isValueChanged("firstName", state.values, defaultValues) ||
      isValueChanged("middleName", state.values, defaultValues) ||
      isValueChanged("lastName", state.values, defaultValues));

  useEffect(() => {
    setIsNationalIdUnknown(!hasNationalId);
  }, [hasNationalId, setIsNationalIdUnknown]);

  return (
    <>
      {hasNationalId ? (
        <Field
          state={state}
          defaultValues={defaultValues}
          name="nationalId"
          label={t("DetailsPage.national-id")}
          editable={editable}
          control={(props) => (
            <SearchInput
              {...props}
              placeholder={t("FormPlaceholders.searchForNationalId")}
              isLoading={personSearch.isLoading}
              onValueChange={(value) => {
                if (value === "") {
                  // reset values if field is cleared
                  setFirstName("");
                  setLastName("");
                  setMiddleName("");
                  setDob("");
                  setCitizenship("–");
                }
                personSearch.onValueChange(value);
              }}
              options={personSearch.options}
              onValueSelect={(value) => {
                const person = personSearch.findByNationalId(value);

                setFirstName(person?.firstName ?? "");
                setLastName(person?.lastName ?? "");
                setMiddleName(person?.middleName ?? "");
                setDob(person?.dob ?? "");
                setCitizenship(person?.citizenship ?? "–");
              }}
            />
          )}
          required
        />
      ) : (
        <input type="hidden" name="nationalId" value="" />
      )}

      {editable && (
        <Field
          state={state}
          name="isPredefinedId"
          defaultValues={defaultValues}
          className="mx-auto"
          control={(props) => {
            return (
              <div className="mx-auto">
                <input
                  {...props}
                  type="hidden"
                  value={hasNationalId ? "true" : "false"}
                />
                {hasNationalId ? (
                  <UnderlineButton
                    className="mx-auto"
                    onClick={() => setHasNationalId(false)}
                  >
                    {t("DetailsPage.national-id-unknown")}
                  </UnderlineButton>
                ) : (
                  <UnderlineButton
                    className="mx-auto"
                    onClick={() => setHasNationalId(true)}
                  >
                    <IconChevronLeft />{" "}
                    {t("DetailsPage.back-to-national-id-search")}
                  </UnderlineButton>
                )}
              </div>
            );
          }}
        />
      )}
      {hasNationalId ? (
        <>
          <DataNode
            label={
              nameWithDescriptions
                ? t("DetailsPage.nameWithDescription")
                : t("DetailsPage.name")
            }
            isHighlighted={isNameChanged}
          >
            <input type="hidden" name="firstName" value={firstName} />
            <input type="hidden" name="middleName" value={middleName} />
            <input type="hidden" name="lastName" value={lastName} />

            {fullName || "–"}
          </DataNode>
          <DataNode
            label={t("DetailsPage.dob")}
            isHighlighted={
              !editable && isValueChanged("dob", { dob }, defaultValues)
            }
          >
            <input type="hidden" name="dob" value={dob} />

            {dob ? format.dateTime(new Date(dob)) : "–"}
          </DataNode>

          <DataNode
            label={t("DetailsPage.citizenship")}
            isHighlighted={
              !editable &&
              isValueChanged("citizenship", { citizenship }, defaultValues)
            }
          >
            <input type="hidden" name="citizenship" value={citizenship} />

            {citizenship || "–"}
          </DataNode>
        </>
      ) : (
        <>
          <Field
            state={state}
            defaultValues={defaultValues}
            name="firstName"
            label={t("DetailsPage.first-name")}
            control={(props) => <Input {...props} />}
            editable={editable}
            required
          />

          <Field
            state={state}
            defaultValues={defaultValues}
            name="middleName"
            label={t("DetailsPage.middle-name")}
            control={(props) => <Input {...props} />}
            editable={editable}
          />

          <Field
            state={state}
            defaultValues={defaultValues}
            name="lastName"
            label={t("DetailsPage.last-name")}
            control={(props) => <Input {...props} />}
            editable={editable}
            required
          />

          <Field
            state={state}
            defaultValues={defaultValues}
            name="passportNumber"
            label={t("DetailsPage.passport-number")}
            control={(props) => <Input {...props} />}
            editable={editable}
            required
          />
          <Field
            state={state}
            defaultValues={defaultValues}
            name="dob"
            isDate
            label={t("DetailsPage.dob")}
            editable={editable}
            control={(props) => <DatePicker {...props} />}
          />

          <Field
            state={state}
            defaultValues={defaultValues}
            name="citizenship"
            label={t("DetailsPage.citizenship")}
            editable={editable}
            control={(props) => (
              <SearchInput
                {...props}
                placeholder={t("FormPlaceholders.select")}
                options={nationalityOptions}
                endDecorator={<IconCaretDownFilled />}
              />
            )}
          />
        </>
      )}
      <Field
        state={state}
        defaultValues={defaultValues}
        name="nationality"
        label={t("DetailsPage.nationality")}
        editable={editable}
        control={(props) => (
          <SearchInput
            {...props}
            placeholder={t("FormPlaceholders.select")}
            options={nationalityOptions}
            endDecorator={<IconCaretDownFilled />}
          />
        )}
        required
      />
    </>
  );
};
