"use client";

import { IconChevronLeft, IconPlus } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import React, { useCallback, useState, type FC } from "react";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { CallingCodeSelect } from "@workspace/ui/components/calling-code-select";
import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, FieldGroup } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounce";
import { useForm } from "@workspace/ui/hooks/use-form";
import { cn } from "@workspace/ui/lib/utils";

import { FormWrap } from "@/app/add/form-wrap";
import { informantAction } from "@/app/add/informant/informant-action";
import { informantSchema } from "@/app/add/informant/informant-schema";
import type { Person } from "@/lib/schema/person-schema";
import { searchPerson } from "@/lib/services/birth-registration-service";
import { nationalities } from "@/lib/util/nationalities";

export interface InformantFormProps {
  id: string;
  informant: Partial<Person>;
  mother: Partial<Person> | undefined;
  father: Partial<Person> | undefined;
}

export const InformantForm: FC<InformantFormProps> = ({
  id,
  informant,
  mother,
  father,
}) => {
  const t = useTranslations();
  const format = useFormatter();
  const [defaultValues, setDefaultValues] =
    useState<Partial<Person>>(informant);
  const [formValues, setFormValues] = useState<Partial<Person>>(informant);
  const [informantType, setInformantType] = useState<string>(
    informant?.informantType ?? "Other",
  );

  //  let defaultValues: Partial<InformantSchema> = informant as InformantSchema;

  const [state, formAction, isPending] = useForm(
    informantAction,
    informantSchema,
    defaultValues,
  );
  const defaultNationalId =
    !defaultValues?.nationalId &&
    defaultValues?.firstName &&
    defaultValues?.lastName
      ? false
      : true;
  const [natonalId, setNatonalId] = useState<boolean>(defaultNationalId);
  const [nationalIdOptions, setNationalIdOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState<string>(
    defaultValues?.firstName ?? "",
  );
  const [lastName, setLastName] = useState<string>(
    defaultValues?.lastName ?? "",
  );
  const [middleName, setMiddleName] = useState<string>(
    defaultValues?.middleName ?? "",
  );
  const [birthDate, setBirthDate] = useState<string>(defaultValues?.dob ?? "");
  const [citizenship, setCitizenship] = useState<string>(
    defaultValues?.citizenship ?? "–",
  );
  const [searchedPersonList, setSearchedPersonList] = useState<Person[]>([]);
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
  const nationalityOptions = nationalities.map((nationality) => ({
    label: nationality,
    value: nationality,
  }));
  const [searchedText, setSearchedText] = useState<string>("");

  const debouncedSearch = useDebouncedCallback(async (search?: string) => {
    if (search === searchedText) {
      return;
    }
    if (!search) {
      setNationalIdOptions([]);
      return;
    }

    setIsLoading(true);
    setSearchedText(search);
    const res = await searchPerson(search);

    const options = res.map((person: Person) => ({
      label: `${person.firstName} ${person.lastName} (${person.nationalId})`,
      value: person.nationalId,
    }));

    setNationalIdOptions(options);
    setIsLoading(false);
    setSearchedPersonList(res);
  }, 300);

  const handleSearch = useCallback((value: string | undefined) => {
    debouncedSearch(value);
  }, []);

  const getSearchedPersonByNationalId = (nationalId: string) => {
    const person = searchedPersonList.find(
      (person) => person.nationalId === nationalId,
    );
    return person;
  };

  const informantOptions = [
    { label: t("DetailsPage.family-member"), value: "Family member" },
    { label: t("DetailsPage.tba"), value: "T.B.A" },
    { label: t("DetailsPage.midwife"), value: "Midwife" },
    { label: t("DetailsPage.medical-attendant"), value: "Medical Attendant" },
    { label: t("DetailsPage.other"), value: "Other" },
  ];

  const relationOptions = [
    { label: t("DetailsPage.parent"), value: "Parent" },
    { label: t("DetailsPage.sibling"), value: "Sibling" },
    { label: t("DetailsPage.spouse"), value: "Spouse" },
    { label: t("DetailsPage.guardian"), value: "Guardian" },
    { label: t("DetailsPage.relative"), value: "Relative" },
    { label: t("DetailsPage.friend"), value: "Friend" },
    { label: t("DetailsPage.colleague"), value: "Colleague" },
    { label: t("DetailsPage.neighbor"), value: "Neighbor" },
    { label: t("DetailsPage.employer"), value: "Employer" },
    { label: t("DetailsPage.employee"), value: "Employee" },
    { label: t("DetailsPage.partner"), value: "Partner" },
    { label: t("DetailsPage.other"), value: "Other" },
  ];

  const informantTypeOptions = [
    { label: t("DetailsPage.mother"), value: t("DetailsPage.mother") },
    { label: t("DetailsPage.father"), value: t("DetailsPage.father") },
    { label: t("DetailsPage.other"), value: t("DetailsPage.other") },
  ];

  return (
    <FormWrap action={formAction} prevUrl="/add/father" className="space-y-4">
      <input type="hidden" name="id" value={defaultValues?.id} />
      <DataBlock
        title={t(`DetailsPage.title-informant`)}
        disabled={undefined}
        active={undefined}
        toggleEdit={undefined}
      >
        <>
          <ButtonGroup
            name="informantType"
            onValueChange={(value) => {
              console.log(value);
              if (value === "Other") {
                setFormValues(defaultValues);
                setInformantType("Other");
              } else if (value === "Mother") {
                setFormValues(mother ?? {});
                setInformantType("Mother");
              } else if (value === "Father") {
                setFormValues(father ?? {});
                setInformantType("Father");
              }
            }}
            type="single"
            defaultValue={defaultValues.informantType}
          >
            <React.Fragment key=".0">
              {informantTypeOptions.map((option) => (
                <ButtonGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ButtonGroupItem>
              ))}
            </React.Fragment>
          </ButtonGroup>
        </>
        {informantType !== "Other" && (
          <DataNode label={t("DetailsPage.name")} variant="default">
            <input
              type="hidden"
              name="firstName"
              value={formValues.firstName}
            />
            <input
              type="hidden"
              name="middleName"
              value={formValues.middleName}
            />
            <input type="hidden" name="lastName" value={formValues.lastName} />
            <input type="hidden" name="dob" value={formValues.dob} />
            <input type="hidden" name="capacityOfInformant" value={"Other"} />
            <input type="hidden" name="email" value={formValues.email} />
            <input
              type="hidden"
              name="citizenship"
              value={formValues.citizenship}
            />
            <input type="hidden" name="phone" value={formValues.phone} />
            <input
              type="hidden"
              name="phoneCode"
              value={formValues.phoneCode}
            />
            <input
              type="hidden"
              name="nationality"
              value={formValues.nationality}
            />
            <input type="hidden" name="natureOfRelation" value={"Other"} />

            {[formValues.firstName, formValues.middleName, formValues.lastName]
              .filter(Boolean)
              .join(" ")}
          </DataNode>
        )}
        {informantType === "Other" && natonalId && (
          <Field
            state={state}
            name="nationalId"
            label={t("DetailsPage.national-id")}
            control={(props) => (
              <SearchInput
                {...props}
                isLoading={isLoading}
                onValueChange={handleSearch}
                options={nationalIdOptions}
                onValueSelect={(value) => {
                  const person = getSearchedPersonByNationalId(value);
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
        )}
        {informantType === "Other" && natonalId && (
          <div className={cn("flex justify-center underline")}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setNatonalId(false);
              }}
            >
              {t("DetailsPage.national-id-unknown")}
            </a>
          </div>
        )}
        {informantType === "Other" && !natonalId && (
          <div className={cn("flex justify-center underline")}>
            <a
              href="#"
              className="flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                setNatonalId(true);
              }}
            >
              <IconChevronLeft /> {t("DetailsPage.back-to-national-id-search")}
            </a>
          </div>
        )}

        <>
          {informantType === "Other" && !natonalId && (
            <>
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
                name="lastName"
                label={t("DetailsPage.lastname")}
                control={(props) => <Input {...props} />}
                required
              />
            </>
          )}
          {informantType === "Other" && natonalId && (
            <DataNode label={t("DetailsPage.name")} variant="default">
              <input type="hidden" name="firstName" value={firstName} />
              <input type="hidden" name="middleName" value={middleName} />
              <input type="hidden" name="lastName" value={lastName} />

              {fullName && fullName !== " " ? fullName : "–"}
            </DataNode>
          )}
        </>

        {informantType === "Other" && !natonalId && (
          <Field
            state={state}
            name="passportNumber"
            label={t("DetailsPage.passport-number")}
            control={(props) => <Input {...props} />}
            required
          />
        )}

        {informantType === "Other" && !natonalId && (
          <Field
            state={state}
            name="dob"
            isDate
            label={t("DetailsPage.dob")}
            editable={!natonalId}
            control={(props) => <DatePicker {...props} />}
            required={!natonalId}
          />
        )}

        {informantType === "Other" && natonalId && (
          <DataNode label={t("DetailsPage.dob")} variant="default">
            <input type="hidden" name="dob" value={birthDate} />

            {birthDate ? format.dateTime(new Date(birthDate)) : "–"}
          </DataNode>
        )}

        {informantType === "Other" && !natonalId && (
          <Field
            state={state}
            name="citizenship"
            label={t("DetailsPage.citizenship")}
            editable={!natonalId}
            control={(props) => <Input {...props} />}
            required={false}
          />
        )}

        {informantType === "Other" && natonalId && (
          <DataNode label={t("DetailsPage.citizenship")} variant="default">
            <input type="hidden" name="citizenship" value={citizenship} />

            {citizenship ?? "–"}
          </DataNode>
        )}
        {informantType === "Other" && (
          <Field
            state={state}
            name="nationality"
            label={t("DetailsPage.nationality")}
            control={(props) => (
              <SearchInput {...props} options={nationalityOptions} />
            )}
            required
          />
        )}

        {informantType === "Other" && (
          <Field
            state={state}
            control={(props) => (
              <RadioGroup
                {...props}
                orientation="vertical"
                size="md"
                options={informantOptions}
              />
            )}
            label={t("DetailsPage.capacity-of-informant")}
            name="capacityOfInformant"
            required
          />
        )}

        {informantType === "Other" && (
          <Field
            state={state}
            name="natureOfRelation"
            label={t("DetailsPage.nature-of-relation")}
            control={(props) => (
              <SearchInput {...props} options={relationOptions} />
            )}
            required
          />
        )}

        {informantType === "Other" && (
          <FieldGroup label={t("DetailsPage.phone")} required>
            <>
              <Field
                state={state}
                name="phoneCode"
                className="max-w-40"
                required
                control={(props) => <CallingCodeSelect {...props} />}
              />
              <Field
                state={state}
                name="phone"
                required
                control={(props) => <Input type="tel" {...props} />}
              />
            </>
          </FieldGroup>
        )}

        {informantType === "Other" && (
          <>
            <Field
              state={state}
              name="email"
              label={t("DetailsPage.email")}
              control={(props) => <Input {...props} />}
              required={false}
            />
            <div className={cn("flex justify-center underline")}>
              <a
                href="#"
                className="flex items-center gap-1"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                <IconPlus />
                {t("DetailsPage.add-another-contact")}
              </a>
            </div>
          </>
        )}
      </DataBlock>
    </FormWrap>
  );
};
