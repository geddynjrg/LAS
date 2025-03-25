import { useTranslations } from "next-intl";
import React, { useEffect, useState, type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, FieldGroup, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { motherAction } from "@/app/edit/[personId]/mother/mother-action";
import { motherSchema } from "@/app/edit/[personId]/mother/mother-schema";
import { educationOptions } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";
import { nationalities } from "@/lib/util/nationalities";

interface MotherFormBlockProps {
  defaultValues: Person;
  disabled: boolean;
  handleIsEditing: (id: string) => void;
}

export const MotherFormBlock: FC<MotherFormBlockProps> = ({
  disabled,
  defaultValues,
  handleIsEditing,
}) => {
  const t = useTranslations();

  const [person, setPerson] = useState<Person>(defaultValues);
  const [toggleEdit, setToggleEdit] = useState<boolean>(false);

  const [contacts] = useState(
    defaultValues?.contacts ?? [{ phoneCode: "", phone: "", email: "" }],
  );

  const [state, action, isPending] = useForm(motherAction, motherSchema, {
    id: defaultValues.id,
    nationalId: defaultValues.nationalId,
    firstName: defaultValues.firstName,
    middleName: defaultValues.middleName,
    lastName: defaultValues.lastName,
    sex: defaultValues.sex,
    dob: defaultValues.dob,
    citizenship: defaultValues?.citizenship,
    nationality: defaultValues?.nationality,
    maritalStatus: defaultValues?.maritalStatus,
    education: defaultValues?.education,
    contacts: defaultValues?.contacts,
    fatherName: defaultValues?.fatherName,
  });

  useEffect(() => {
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

  const [firstName] = useState<string>(defaultValues?.firstName ?? "");
  const [lastName] = useState<string>(defaultValues?.lastName ?? "");
  const [middleName] = useState<string>(defaultValues?.middleName ?? "");

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const nationalityOptions = nationalities.map((nationality) => ({
    label: nationality,
    value: nationality,
  }));

  const marriedOptions = [
    { label: t("DetailsPage.married"), value: "Married" },
    { label: t("DetailsPage.divorced"), value: "Divorced" },
    { label: t("DetailsPage.single"), value: "Single" },
    { label: t("DetailsPage.widowed"), value: "Widowed" },
  ];

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
        title={t(`DetailsPage.title-mother`)}
        disabled={disabled}
        active={toggleEdit}
        toggleEdit={() => {
          handleIsEditing(toggleEdit ? "" : person.id);
          setToggleEdit(!toggleEdit);

          return null;
        }}
      >
        <Field
          state={state}
          editable={false}
          name="nationalId"
          label={t("DetailsPage.national-id")}
          control={(props) => <Input {...props} />}
          required={false}
        />
        <DataNode label={t("DetailsPage.name")} variant="default">
          <input type="hidden" name="firstName" value={firstName} />
          <input type="hidden" name="middleName" value={middleName} />
          <input type="hidden" name="lastName" value={lastName} />

          {fullName && fullName !== " " ? fullName : "–"}
        </DataNode>

        <Field
          state={state}
          name="dob"
          isDate
          editable={false}
          label={t("DetailsPage.dob")}
          control={(props) => <DatePicker {...props} />}
        />

        <input type="hidden" name="sex" value={person.sex} />
        <Field
          state={state}
          name="citizenship"
          label={t("DetailsPage.citizenship")}
          editable={false}
          control={(props) => <Input {...props} />}
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
          control={(props) => (
            <RadioGroup
              {...props}
              orientation="vertical"
              size="md"
              options={marriedOptions}
            />
          )}
          editable={toggleEdit}
          label={t("DetailsPage.marital-status")}
          name="maritalStatus"
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

        <Field
          state={state}
          name="fatherName"
          editable={toggleEdit}
          label={t("DetailsPage.fathers-name")}
          control={(props) => <Input {...props} />}
          required={false}
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
      </DataBlock>
    </Form>
  );
};
