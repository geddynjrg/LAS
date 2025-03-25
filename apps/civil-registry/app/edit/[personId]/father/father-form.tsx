import { IconChevronLeft } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import React, { useCallback, useEffect, useState, type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Divider } from "@workspace/ui/components/divider";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, FieldGroup, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounce";
import { useForm } from "@workspace/ui/hooks/use-form";
import { cn, formatBytes } from "@workspace/ui/lib/utils";

import { fatherAction } from "@/app/edit/[personId]/father/father-action";
import { fatherSchema } from "@/app/edit/[personId]/father/father-schema";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { educationOptions } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";
import { searchPersonBySex } from "@/lib/services/birth-registration-service";
import { nationalities } from "@/lib/util/nationalities";

interface FatherFormBlockProps {
  defaultValues: Person;
  disabled: boolean;
  handleIsEditing: (id: string) => void;
}

export const FatherFormBlock: FC<FatherFormBlockProps> = ({
  disabled,
  defaultValues,
  handleIsEditing,
}) => {
  const t = useTranslations();
  const format = useFormatter();

  const [person, setPerson] = useState<Person>(defaultValues);
  const [toggleEdit, setToggleEdit] = useState<boolean>(false);

  const [contacts] = useState(
    defaultValues?.contacts ?? [{ phoneCode: "", phone: "", email: "" }],
  );

  const [state, action, isPending] = useForm(fatherAction, fatherSchema, {
    id: defaultValues.id,
    nationalId: defaultValues.nationalId,
    firstName: defaultValues.firstName,
    middleName: defaultValues.middleName,
    lastName: defaultValues.lastName,
    sex: defaultValues.sex,
    dob: defaultValues.dob,
    citizenship: defaultValues?.citizenship,
    nationality: defaultValues?.nationality,
    education: defaultValues?.education,
    contacts: defaultValues?.contacts,
    affidavit: person?.affidavit,
  });

  useEffect(() => {
    console.log(state);
    if (state.success) {
      if (state.values) {
        const newValues = state.values as Partial<Person>;
        const changedFields: Partial<Person> = {};

        Object.keys(newValues).forEach((key) => {
          let personKey = key as keyof Person;
          if (newValues[personKey] !== undefined) {
            const newValue = newValues[personKey];

            if (newValue !== undefined && newValue !== person[personKey]) {
              // @ts-ignore
              changedFields[personKey] = newValue as Person[keyof Person];
            }
          }
        });

        if (Object.keys(changedFields).length > 0) {
          setPerson((prevPerson) => ({
            ...prevPerson,
            ...changedFields,
          }));
        }
      }
      handleIsEditing("");
      setToggleEdit(false);
    }
  }, [state]);

  const [firstName, setFirstName] = useState<string>(
    defaultValues?.firstName ?? "",
  );
  const [lastName, setLastName] = useState<string>(
    defaultValues?.lastName ?? "",
  );
  const [middleName, setMiddleName] = useState<string>(
    defaultValues?.middleName ?? "",
  );

  const [natonalId, setNatonalId] = useState<boolean>(true);

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const nationalityOptions = nationalities.map((nationality) => ({
    label: nationality,
    value: nationality,
  }));

  const [birthDate, setBirthDate] = useState<string>(defaultValues?.dob ?? "");
  const [citizenship, setCitizenship] = useState<string>(
    defaultValues?.citizenship ?? "–",
  );

  const [isLoading, setIsLoading] = useState(false);
  const [searchedText, setSearchedText] = useState<string>("");
  const [searchedPersonList, setSearchedPersonList] = useState<
    Partial<Person>[]
  >([]);

  const [nationalIdOptions, setNationalIdOptions] = useState<
    { label: string; value: string }[]
  >([]);

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
    const options = res.map((person: Partial<Person>) => ({
      label: `${person.firstName} ${person.lastName} (${person.nationalId})`,
      value: person?.nationalId ?? "",
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
    <Form className="space-y-6" action={action}>
      <Field
        state={state}
        name="id"
        isVisible={false}
        editable={false}
        control={(props) => <Input {...props} />}
      />
      <DataBlock
        title={t(`DetailsPage.title-father`)}
        disabled={disabled}
        active={toggleEdit}
        toggleEdit={() => {
          handleIsEditing(toggleEdit ? "" : person.id);
          setToggleEdit(!toggleEdit);

          return null;
        }}
      >
        {toggleEdit && (
          <Alert
            position="local"
            title={t("DetailsPage.affidavit-required")}
            variant="warning"
          >
            {t("DetailsPage.affidavit-required-text")}
          </Alert>
        )}
        {natonalId && (
          <Field
            state={state}
            editable={toggleEdit}
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
            required={toggleEdit}
          />
        )}
        {toggleEdit && natonalId && (
          <div className={cn("flex justify-center underline")}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setNatonalId(false);
              }}
            >
              {t("DetailsPage.father-national-id-unknown")}
            </a>
          </div>
        )}
        {toggleEdit && !natonalId && (
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

        {toggleEdit && !natonalId ? (
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

        {!natonalId && (
          <Field
            state={state}
            name="passportNumber"
            label={t("DetailsPage.passport-number")}
            editable={toggleEdit}
            control={(props) => <Input {...props} />}
            required={toggleEdit}
          />
        )}
        {toggleEdit && (
          <Field
            state={state}
            name="dob"
            isDate
            editable={!natonalId}
            label={t("DetailsPage.dob")}
            control={(props) => <DatePicker {...props} />}
            required={true}
          />
        )}
        {birthDate && !toggleEdit && (
          <DataNode label={t("DetailsPage.dob")}>
            <input type="hidden" name="dob" value={birthDate} />
            {birthDate && format.dateTime(new Date(birthDate))}
          </DataNode>
        )}

        <input type="hidden" name="sex" value={person.sex} />
        <Field
          state={state}
          name="citizenship"
          label={t("DetailsPage.citizenship")}
          editable={!natonalId && toggleEdit}
          control={(props) => <Input {...props} defaultValue={citizenship} />}
          required={false}
        />

        <Field
          state={state}
          name="nationality"
          label={t("DetailsPage.nationality")}
          editable={toggleEdit}
          control={(props) => (
            <SearchInput {...props} options={nationalityOptions} />
          )}
          required={toggleEdit}
        />
        <Field
          state={state}
          name="education"
          editable={toggleEdit}
          label={t("DetailsPage.education")}
          control={(props) => (
            <SearchInput {...props} options={educationOptions} />
          )}
          required={toggleEdit}
        />

        {contacts.map((contact, index) => (
          <div key={`contact-list-${index}`}>
            <Field
              key={`phoneCode-${index}`}
              state={state}
              isVisible={false}
              name={`contacts.${index}.phoneCode`}
              className="max-w-40"
              required={false}
              control={(props) => <Input {...props} />}
            />
            <Field
              key={`phone-${index}`}
              state={state}
              isVisible={false}
              name={`contacts.${index}.phone`}
              required={false}
              control={(props) => <Input type="tel" {...props} />}
            />
            <FieldGroup
              label={t("DetailsPage.phone")}
              required={false}
              key={`phone-contact-${index}`}
            >
              <p key={`phone-${index}`}>
                +{contact?.phoneCode} {contact?.phone}
              </p>
            </FieldGroup>

            {contact?.email && (
              <FieldGroup label={t("DetailsPage.email")} key={`${index}-email`}>
                <Field
                  key={`email-${index}`}
                  state={state}
                  isVisible={false}
                  name={`contacts.${index}.email`}
                  label={t("DetailsPage.email")}
                  control={(props) => <Input {...props} />}
                  required={false}
                />
                <p>{contact?.email}</p>
              </FieldGroup>
            )}
          </div>
        ))}

        {toggleEdit && (
          <>
            <Divider />
            <Alert
              position="local"
              title={t("DetailsPage.steps-required")}
              variant="info"
            >
              {t("DetailsPage.steps-required-text")}
            </Alert>
            <Field
              state={state}
              name="affidavitFile"
              label={t("DetailsPage.affidavit")}
              required
              description={`Max file size ${formatBytes(MAX_FILE_SIZE)}`}
              control={(props) => (
                <FileUploadInput
                  accept={{
                    "image/*": [".jpg", ".png"],
                    "application/pdf": [".pdf"],
                  }}
                  maxSize={MAX_FILE_SIZE}
                  {...props}
                />
              )}
            />
            <div className={cn("flex justify-center underline")}>
              <a
                href="#"
                className="flex items-center gap-1"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                {t("DetailsPage.affidavit-edit-message")}
              </a>
            </div>
          </>
        )}
        {!toggleEdit && person?.affidavit && (
          <FieldGroup label={t("DetailsPage.affidavit")}>
            <p>{person?.affidavit}</p>
          </FieldGroup>
        )}
      </DataBlock>
    </Form>
  );
};
