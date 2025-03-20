"use client";

import { IconChevronLeft, IconPlus } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useState, type FC } from "react";

import { CallingCodeSelect } from "@workspace/ui/components/calling-code-select";
import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, FieldGroup } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounce";
import { useForm } from "@workspace/ui/hooks/use-form";
import { cn } from "@workspace/ui/lib/utils";

import { fatherAction } from "@/app/add/father/father-action";
import {
  fatherSchema,
  type FatherSchema,
} from "@/app/add/father/father-schema";
import { FormWrap } from "@/app/add/form-wrap";
import { educationOptions } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/schema/person-schema";
import { searchPersonBySex } from "@/lib/services/birth-registration-service";
import { nationalities } from "@/lib/util/nationalities";

export interface FatherFormProps {
  id: string;
  defaultValues?: Partial<
    FatherSchema & { father?: string | Person; mother?: string | Person }
  >;
}

export const FatherForm: FC<FatherFormProps> = ({ id, defaultValues }) => {
  const t = useTranslations();
  const format = useFormatter();
  const [state, formAction, isPending] = useForm(
    fatherAction,
    fatherSchema,
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

  const [isLoading, setIsLoading] = useState(false);
  const [searchedText, setSearchedText] = useState<string>("");

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
  const nationalityOptions = nationalities.map((nationality) => ({
    label: nationality,
    value: nationality,
  }));

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
    const res = await searchPersonBySex(search, "M");
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

  return (
    <FormWrap action={formAction} prevUrl="/add/mother" className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <DataBlock
        title={t(`DetailsPage.title-father`)}
        disabled={undefined}
        active={undefined}
        toggleEdit={undefined}
      >
        {natonalId && (
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
        {natonalId && (
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
        {!natonalId && (
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
          {!natonalId ? (
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
          ) : (
            <DataNode label={t("DetailsPage.name")} variant="default">
              <input type="hidden" name="firstName" value={firstName} />
              <input type="hidden" name="middleName" value={middleName} />
              <input type="hidden" name="lastName" value={lastName} />

              {fullName && fullName !== " " ? fullName : "–"}
            </DataNode>
          )}
        </>

        {!natonalId && (
          <Field
            state={state}
            name="passportNumber"
            label={t("DetailsPage.passport-number")}
            control={(props) => <Input {...props} />}
            required
          />
        )}

        {!natonalId && (
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

        {natonalId && (
          <DataNode label={t("DetailsPage.dob")} variant="default">
            <input type="hidden" name="dob" value={birthDate} />

            {birthDate ? format.dateTime(new Date(birthDate)) : "–"}
          </DataNode>
        )}

        {!natonalId && (
          <Field
            state={state}
            name="citizenship"
            label={t("DetailsPage.citizenship")}
            editable={!natonalId}
            control={(props) => <Input {...props} />}
            required={false}
          />
        )}

        {natonalId && (
          <DataNode label={t("DetailsPage.citizenship")} variant="default">
            <input type="hidden" name="citizenship" value={citizenship} />

            {citizenship ?? "–"}
          </DataNode>
        )}

        <Field
          state={state}
          name="nationality"
          label={t("DetailsPage.nationality")}
          control={(props) => (
            <SearchInput {...props} options={nationalityOptions} />
          )}
          required
        />

        <Field
          state={state}
          name="education"
          label={t("DetailsPage.education")}
          control={(props) => (
            <SearchInput {...props} options={educationOptions} />
          )}
          required={false}
        />

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
      </DataBlock>
    </FormWrap>
  );
};
