import { IconInfoSquareRounded } from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, type FC, type ReactNode } from "react";
import type { z } from "zod";

import { Alert } from "@workspace/ui/components/alert";
import { CallingCodeSelect } from "@workspace/ui/components/calling-code-select";
import {
  DataBlock,
  DataBlockProps,
} from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, FieldGroup, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Select } from "@workspace/ui/components/select";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { cn, getFormDataValues } from "@workspace/ui/lib/utils";

import { updatePersonById } from "@/actions/update-person-data";
import type { Person } from "@/lib/data/person";
import { personFormSchema } from "@/lib/schema/person-schema";
import { getAgeByDoB } from "@/lib/util/age";
import { getFullName } from "@/lib/util/full-name";
import { nationalities } from "@/lib/util/nationalities";

interface DisplayFields {
  name?: boolean;
  nationalId?: boolean;
  dob?: boolean;
  age?: boolean;
  sex?: boolean;
  weightOnBirth?: boolean;
  placeOfBirth?: boolean;
  citizenship?: boolean;
  nationality?: boolean;
  maritalStatus?: boolean;
  education?: boolean;
  mother?: boolean;
  father?: boolean;
  phone?: boolean;
}

interface EditableFields extends DisplayFields {
  firstName?: boolean;
  middleName?: boolean;
  lastName?: boolean;
}

interface PersonFormBlockProps
  extends Pick<DataBlockProps, "active" | "disabled"> {
  data: Person;
  displayField: DisplayFields;
  editableField?: EditableFields;
  active: boolean;
  toggleEdit: (id: string, reqPayment?: boolean) => void;
  showFieldNotifications?: boolean;
  affidavitRequired?: boolean;
  isChild?: boolean;
  isMother?: boolean;
  isFather?: boolean;
}

const formAction: FormAction<z.infer<typeof personFormSchema>> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, personFormSchema);

  const { error, data, success } = personFormSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  const res = await updatePersonById(data.id, data as Partial<Person>);

  return {
    success: true,
    values: data,
  };
};

export const PersonFormBlock: FC<PersonFormBlockProps> = ({
  disabled,
  active,
  data,
  displayField,
  editableField,
  toggleEdit,
  affidavitRequired = false,
  showFieldNotifications = false,
  isChild = false,
  isMother = false,
  isFather = false,
}) => {
  const [person, setPerson] = useState<Person>(data);

  const t = useTranslations();
  const format = useFormatter();

  const sexDisplayFormat = {
    M: t("DetailsPage.male"),
    F: t("DetailsPage.female"),
  };
  const defaultValues = {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    sex: person.sex,
    dob: person.dob,
    middleName: person.middleName,
    weightOnBirth: person?.weightOnBirth,
    placeOfBirth: person?.placeOfBirth,
    nationalId: person?.nationalId,
    citizenship: person?.citizenship,
    nationality: person?.nationality,
    maritalStatus: person?.maritalStatus,
    education: person?.education,
    father: person?.father ? getFullName(person.father as Person) : undefined,
    mother: person?.mother ? getFullName(person.father as Person) : undefined,
    phone: person?.phone,
    phoneCode: person?.phoneCode?.replace("+", ""),
  };

  const [state, action, isPending] = useForm(
    formAction,
    personFormSchema,
    defaultValues,
  );

  type DataVariant = "default" | "disabled";
  const variant: DataVariant = disabled ? "disabled" : "default";

  const sexOptions = [
    { label: t("DetailsPage.male"), value: "M" },
    { label: t("DetailsPage.female"), value: "F" },
  ];

  const marriedOptions = [
    { label: t("DetailsPage.married"), value: "Married" },
    { label: t("DetailsPage.divorced"), value: "Divorced" },
    { label: t("DetailsPage.single"), value: "Single" },
    { label: t("DetailsPage.widowed"), value: "Widowed" },
  ];

  const educationOptions = [
    { label: "High school", value: "High School" },
    { label: "Associate degree", value: "Associate Degree" },
    { label: "Bachelor's degree", value: "Bachelor's Degree" },
    { label: "Master's degree", value: "Master's Degree" },
    { label: "Doctorate", value: "Doctorate/PhD" },
    { label: "Postdoctoral Studies", value: "Postdoctoral Studies" },
  ];

  const nationalityOptions = nationalities.map((nationality) => ({
    label: nationality,
    value: nationality,
  }));

  useEffect(() => {
    if (state.success) {
      let requestPayment = false;
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
          requestPayment = true;
        }
      }
      console.log(isChild, requestPayment, requestPayment && isChild);
      toggleEdit(person.id, requestPayment && isChild);
    }
  }, [state]);

  let titleKey: keyof IntlMessages["DetailsPage"] = "title-child";

  if (isMother) {
    titleKey = "title-mother";
  } else if (isFather) {
    titleKey = "title-father";
  } else if (isChild) {
    titleKey = "title-child";
  }

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
        title={t(`DetailsPage.${titleKey}`)}
        disabled={disabled}
        active={active}
        toggleEdit={() => toggleEdit(person.id)}
      >
        {active && affidavitRequired && (
          <Alert
            position="local"
            title={t("DetailsPage.affidavit-required")}
            variant="warning"
          >
            {t("DetailsPage.affidavit-required-text")}
          </Alert>
        )}
        {displayField.name && (
          <>
            {active && editableField?.name ? (
              <>
                <Field
                  state={state}
                  name="firstName"
                  label={t("DetailsPage.first-name")}
                  editable={editableField?.firstName ?? false}
                  control={(props) => <Input {...props} />}
                />

                <Field
                  state={state}
                  name="middleName"
                  label={t("DetailsPage.middle-name")}
                  editable={editableField?.middleName ?? false}
                  control={(props) => <Input {...props} />}
                />

                <Field
                  state={state}
                  name="lastName"
                  label={t("DetailsPage.lastname")}
                  editable={editableField?.lastName ?? false}
                  control={(props) => <Input {...props} />}
                />
              </>
            ) : (
              <DataNode label={t("DetailsPage.name")} variant={variant}>
                {getFullName(person)}
              </DataNode>
            )}
          </>
        )}

        {displayField.nationalId && (
          <Field
            state={state}
            name="nationalId"
            editable={(active && editableField?.nationalId) ?? false}
            label={t("DetailsPage.national-id")}
            control={(props) => <Input {...props} />}
          />
        )}

        {editableField?.dob && displayField.dob ? (
          <Field
            state={state}
            name="dob"
            editable={(active && editableField?.dob) ?? false}
            label={t("DetailsPage.dob")}
            control={(props) => <DatePicker {...props} />}
          />
        ) : (
          <p>{format.dateTime(new Date(person.dob))}</p>
        )}

        {showFieldNotifications && active && displayField.dob && (
          <EditMessage>{t("DetailsPage.change-dob-message")}</EditMessage>
        )}

        {displayField.age && (
          <DataNode label={t("DetailsPage.age")} variant={variant}>
            {getAgeByDoB(person.dob, true) ?? "N/A"}
          </DataNode>
        )}

        {editableField?.sex && displayField.sex ? (
          <Field
            state={state}
            name="sex"
            editable={(active && editableField?.sex) ?? false}
            label={t("DetailsPage.sex")}
            control={(props) => <Select options={sexOptions} {...props} />}
          />
        ) : (
          <DataNode label={t("DetailsPage.sex")} variant={variant}>
            {sexDisplayFormat[person.sex]}
          </DataNode>
        )}

        {showFieldNotifications && displayField.sex && active && (
          <EditMessage>{t("DetailsPage.change-sex-message")}</EditMessage>
        )}

        {displayField.weightOnBirth && (
          <Field
            state={state}
            name="weightOnBirth"
            editable={(active && editableField?.weightOnBirth) ?? false}
            label={t("DetailsPage.birth-weight")}
            control={(props) => <Input {...props} />}
          />
        )}

        {displayField.placeOfBirth && (
          <Field
            state={state}
            name="placeOfBirth"
            editable={(active && editableField?.placeOfBirth) ?? false}
            label={t("DetailsPage.place-of-birth")}
            control={(props) => <Input {...props} />}
          />
        )}

        {displayField.citizenship && (
          <Field
            state={state}
            name="citizenship"
            label={t("DetailsPage.citizenship")}
            editable={(active && editableField?.citizenship) ?? false}
            control={(props) => <Input {...props} />}
          />
        )}

        {displayField.nationality && (
          <Field
            state={state}
            name="nationality"
            label={t("DetailsPage.nationality")}
            editable={(active && editableField?.nationality) ?? false}
            control={(props) => (
              <SearchInput {...props} options={nationalityOptions} />
            )}
          />
        )}

        {displayField.maritalStatus && (
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
            editable={(active && editableField?.maritalStatus) ?? false}
            label={t("DetailsPage.marital-status")}
            name="maritalStatus"
          />
        )}

        {displayField.education && (
          <Field
            state={state}
            name="education"
            editable={(active && editableField?.education) ?? false}
            label={t("DetailsPage.education")}
            control={(props) => (
              <SearchInput {...props} options={educationOptions} />
            )}
          />
        )}

        {displayField.mother && (
          <Field
            state={state}
            name="mother"
            editable={(active && editableField?.mother) ?? false}
            label={t("DetailsPage.mothers-name")}
            control={(props) => <Input {...props} />}
          />
        )}

        {displayField.father && (
          <Field
            state={state}
            name="father"
            editable={(active && editableField?.father) ?? false}
            label={t("DetailsPage.fathers-name")}
            control={(props) => <Input {...props} />}
          />
        )}

        {displayField.phone && (
          <FieldGroup label={t("DetailsPage.phone")}>
            {active && editableField?.phone ? (
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
            ) : (
              <p>
                {person?.phoneCode} {person?.phone}
              </p>
            )}
          </FieldGroup>
        )}
      </DataBlock>
    </Form>
  );
};

const EditMessage: FC<{ children: ReactNode }> = ({ children }) => (
  <div className={cn("text-blue-400", "flex items-center gap-1")}>
    <IconInfoSquareRounded size={20} className={cn("shrink-0")} />
    {children}
  </div>
);
