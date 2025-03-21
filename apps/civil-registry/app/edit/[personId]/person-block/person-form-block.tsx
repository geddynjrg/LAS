import {
  IconChevronLeft,
  IconInfoSquareRounded,
  IconPlus,
} from "@tabler/icons-react";
import { useFormatter, useTranslations } from "next-intl";
import React, { useEffect, useState, type FC, type ReactNode } from "react";
import type { z } from "zod";

import { Alert } from "@workspace/ui/components/alert";
import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
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
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { cn, getFormDataValues } from "@workspace/ui/lib/utils";

import { updatePersonById } from "@/actions/update-person-data";
import {
  educationOptions,
  healthInstitutionsOptions,
} from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";
import { childFormSchema, personFormSchema } from "@/lib/schema/person-schema";
import { getAgeByDoB } from "@/lib/util/age";
import { getFullName } from "@/lib/util/full-name";
import { nationalities } from "@/lib/util/nationalities";

export enum PersonType {
  CHILD = "child",
  MOTHER = "mother",
  FATHER = "father",
  INFORMANT = "informant",
}

interface FieldProps {
  isEditable?: boolean;
  isVisible?: boolean;
  isRequired?: boolean;
}

interface Fields {
  natureOfBirth?: FieldProps;
  name?: FieldProps;
  firstName?: FieldProps;
  middleName?: FieldProps;
  lastName?: FieldProps;
  nationalId?: FieldProps;
  dob?: FieldProps;
  age?: FieldProps;
  sex?: FieldProps;
  email?: FieldProps;
  weightOnBirth?: FieldProps;
  placeOfBirth?: FieldProps;
  citizenship?: FieldProps;
  nationality?: FieldProps;
  maritalStatus?: FieldProps;
  education?: FieldProps;
  mother?: FieldProps;
  father?: FieldProps;
  phone?: FieldProps;
  healthInstitution?: FieldProps;
  birthSublocation?: FieldProps;
  birthSublocationDistrict?: FieldProps;
  residenceDistrict?: FieldProps;
  residenceSublocation?: FieldProps;
  passportNumber?: FieldProps;
}

interface PersonFormBlockProps
  extends Pick<DataBlockProps, "active" | "disabled"> {
  data: Person;
  fields: Fields;
  active: boolean;
  toggleEdit?: (id: string, reqPayment?: boolean) => void;
  showFieldNotifications?: boolean;
  affidavitRequired?: boolean;
  type: PersonType;
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

  await updatePersonById(data.id, data as Partial<Person>);

  return {
    success: true,
    values: data,
  };
};
// export const PersonFormBlock: FC<PersonFormBlockProps> = ({

export const PersonFormBlock: FC<PersonFormBlockProps> = ({
  disabled,
  active,
  data,
  fields,
  toggleEdit,
  affidavitRequired = false,
  showFieldNotifications = false,
  type = PersonType.CHILD,
}) => {
  const [person, setPerson] = useState<Person>(data);
  const [natonalId, setNatonalId] = useState<boolean>(
    fields?.nationalId?.isVisible ?? false,
  );
  const [placeOfBirthLocation, setPlaceOfBirthLocation] = useState<string>("");

  const t = useTranslations();
  const format = useFormatter();

  const sexDisplayFormat = {
    M: t("DetailsPage.male"),
    F: t("DetailsPage.female"),
    I: t("DetailsPage.intersex"),
  };
  const getPersonName = (person: Person | string): string => {
    return getFullName(person as Person);
  };

  const defaultValues = {
    id: person.id,
    natureOfBirth: person.natureOfBirth,
    firstName: person.firstName,
    middleName: person.middleName,
    lastName: person.lastName,
    sex: person.sex,
    dob: person.dob,
    email: person.email,
    weightOnBirth: person?.weightOnBirth,
    placeOfBirth: person?.placeOfBirth,
    nationalId: person?.nationalId,
    citizenship: person?.citizenship,
    nationality: person?.nationality,
    maritalStatus: person?.maritalStatus,
    education: person?.education,
    healthInstitution: person?.healthInstitution,
    birthSublocation: person?.birthSublocation,
    birthSublocationDistrict: person?.birthSublocationDistrict,
    father: person?.fatherName,
    mother: person?.mother ? getPersonName(person.mother) : undefined,
    phone: person?.phone,
    residenceDistrict: person?.residenceDistrict,
    residenceSublocation: person?.residenceSublocation,
    passportNumber: person?.passportNumber,
    phoneCode: person?.phoneCode?.replace("+", ""),
  };

  let formSchema: z.ZodSchema = personFormSchema;

  if (type === PersonType.CHILD) {
    formSchema = childFormSchema;
  }

  const [state, action, isPending] = useForm(
    formAction,
    formSchema,
    defaultValues,
  );

  type DataVariant = "default" | "disabled";
  const variant: DataVariant = disabled ? "disabled" : "default";

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

      if (typeof toggleEdit === "function") {
        toggleEdit(
          person?.id ?? "",
          requestPayment && type === PersonType.CHILD,
        );
      }
    }
  }, [state]);

  let titleKey: keyof IntlMessages["DetailsPage"] = "title-child";

  switch (type) {
    case PersonType.MOTHER:
      titleKey = "title-mother";
      break;
    case PersonType.FATHER:
      titleKey = "title-father";
      break;
    case PersonType.CHILD:
      titleKey = "title-child";
      break;
    case PersonType.INFORMANT:
      titleKey = "title-informant";
      break;
    default:
      titleKey = "title-child";
  }

  const sexOptions = [
    { label: t("DetailsPage.male"), value: "M" },
    { label: t("DetailsPage.female"), value: "F" },
    { label: t("DetailsPage.intersex"), value: "I" },
  ];
  const natureOfBirthOptions = [
    { label: t("DetailsPage.live-birth"), value: "LiveBirth" },
    { label: t("DetailsPage.stillbirth"), value: "StillBirth" },
  ];

  const marriedOptions = [
    { label: t("DetailsPage.married"), value: "Married" },
    { label: t("DetailsPage.divorced"), value: "Divorced" },
    { label: t("DetailsPage.single"), value: "Single" },
    { label: t("DetailsPage.widowed"), value: "Widowed" },
  ];

  const informantOptions = [
    { label: t("DetailsPage.mother"), value: t("DetailsPage.mother") },
    { label: t("DetailsPage.father"), value: t("DetailsPage.father") },
    { label: t("DetailsPage.other"), value: t("DetailsPage.other") },
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
        title={t(`DetailsPage.${titleKey}`)}
        disabled={disabled}
        active={active}
        toggleEdit={() => {
          if (typeof toggleEdit === "function") {
            return toggleEdit(person?.id ?? "");
          }

          return null;
        }}
      >
        {type === PersonType.INFORMANT && (
          <>
            <ButtonGroup
              name="informantType"
              onValueChange={() => {}}
              type="single"
              defaultValue={"Other"}
            >
              <React.Fragment key=".0">
                {informantOptions.map((option) => (
                  <ButtonGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </ButtonGroupItem>
                ))}
              </React.Fragment>
            </ButtonGroup>
          </>
        )}
        {active && affidavitRequired && (
          <Alert
            position="local"
            title={t("DetailsPage.affidavit-required")}
            variant="warning"
          >
            {t("DetailsPage.affidavit-required-text")}
          </Alert>
        )}
        {!fields?.healthInstitution?.isEditable && (
          <input
            type="hidden"
            name="healthInstitution"
            value={person?.healthInstitution}
          />
        )}
        {fields?.natureOfBirth?.isEditable && (
          <Field
            control={(props) => {
              return (
                <RadioGroup
                  {...props}
                  options={natureOfBirthOptions}
                  orientation="horizontal"
                  size="md"
                />
              );
            }}
            label="Nature of birth"
            name="natureOfBirth"
            required={fields?.natureOfBirth?.isRequired ?? false}
            state={state}
          />
        )}
        {!fields?.natureOfBirth?.isEditable && (
          <input
            type="hidden"
            name="natureOfBirth"
            value={person?.natureOfBirth}
          />
        )}
        {natonalId && (
          <Field
            state={state}
            name="nationalId"
            editable={(active && fields?.nationalId?.isEditable) ?? false}
            label={t("DetailsPage.national-id")}
            control={(props) => <Input {...props} />}
            required={fields?.nationalId?.isRequired ?? false}
          />
        )}
        {active && natonalId && fields?.nationalId?.isEditable && (
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
        {active && !natonalId && fields?.nationalId?.isEditable && (
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
        {fields.name && (
          <>
            {active && !natonalId && fields?.name?.isVisible ? (
              <>
                <Field
                  state={state}
                  name="firstName"
                  label={t("DetailsPage.first-name")}
                  editable={fields?.firstName?.isEditable ?? false}
                  control={(props) => <Input {...props} />}
                  required
                />

                <Field
                  state={state}
                  name="middleName"
                  label={t("DetailsPage.middle-name")}
                  editable={fields?.middleName?.isEditable ?? false}
                  control={(props) => <Input {...props} />}
                />

                {fields?.lastName?.isVisible && (
                  <Field
                    state={state}
                    name="lastName"
                    label={t("DetailsPage.lastname")}
                    editable={fields?.lastName?.isEditable ?? false}
                    control={(props) => <Input {...props} />}
                    required={fields?.lastName?.isRequired ?? false}
                  />
                )}
              </>
            ) : (
              <DataNode label={t("DetailsPage.name")} variant={variant}>
                <Field
                  state={state}
                  isVisible={false}
                  name="firstName"
                  editable={false}
                  control={(props) => <Input {...props} />}
                />

                <Field
                  state={state}
                  isVisible={false}
                  name="middleName"
                  editable={false}
                  control={(props) => <Input {...props} />}
                />

                <Field
                  state={state}
                  isVisible={false}
                  name="lastName"
                  editable={false}
                  control={(props) => <Input {...props} />}
                  required={false}
                />

                {getFullName(person)}
              </DataNode>
            )}
          </>
        )}
        {!natonalId && fields?.passportNumber?.isVisible && (
          <Field
            state={state}
            name="passportNumber"
            label={t("DetailsPage.passport-number")}
            editable={fields?.passportNumber?.isEditable ?? false}
            control={(props) => <Input {...props} />}
            required={fields?.passportNumber?.isRequired ?? false}
          />
        )}
        {fields?.dob?.isEditable && fields?.dob?.isVisible && (
          <Field
            state={state}
            name="dob"
            isDate
            editable={
              (active && fields?.dob?.isEditable && !natonalId) ?? false
            }
            label={t("DetailsPage.dob")}
            control={(props) => <DatePicker {...props} />}
            required={fields?.dob?.isRequired ?? false}
          />
        )}
        {fields?.dob?.isVisible && !fields?.dob?.isEditable && (
          <DataNode label={t("DetailsPage.dob")} variant={variant}>
            <input type="hidden" name="dob" value={person.dob} />
            {person.dob && format.dateTime(new Date(person.dob))}
          </DataNode>
        )}
        {showFieldNotifications && active && fields?.dob?.isVisible && (
          <EditMessage>{t("DetailsPage.change-dob-message")}</EditMessage>
        )}
        {fields?.age?.isVisible && (
          <DataNode label={t("DetailsPage.age")} variant={variant}>
            {person.dob ? getAgeByDoB(person.dob, true) : "N/A"}
          </DataNode>
        )}
        {fields?.sex?.isEditable && fields?.sex?.isVisible && (
          <>
            <DataNode
              label={t("DetailsPage.sex")}
              variant={variant}
              required={fields?.sex?.isRequired ?? false}
            />
            <ButtonGroup
              name="sex"
              onValueChange={() => {}}
              type="single"
              defaultValue={person.sex}
            >
              <React.Fragment key=".0">
                {sexOptions.map((option) => (
                  <ButtonGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </ButtonGroupItem>
                ))}
              </React.Fragment>
            </ButtonGroup>
          </>
        )}
        {fields?.sex?.isVisible && (
          <DataNode label={t("DetailsPage.sex")} variant={variant}>
            <input type="hidden" name="sex" value={person.sex} />
            {person.sex && sexDisplayFormat[person.sex]}
          </DataNode>
        )}
        {showFieldNotifications && fields?.sex?.isVisible && active && (
          <EditMessage>{t("DetailsPage.change-sex-message")}</EditMessage>
        )}
        {fields?.weightOnBirth?.isVisible && (
          <Field
            state={state}
            name="weightOnBirth"
            editable={(active && fields?.weightOnBirth?.isEditable) ?? false}
            label={t("DetailsPage.birth-weight")}
            control={(props) => <Input {...props} endDecorator="kg" />}
            required={fields?.weightOnBirth?.isRequired ?? false}
          />
        )}
        {fields?.citizenship?.isVisible && (
          <Field
            state={state}
            name="citizenship"
            label={t("DetailsPage.citizenship")}
            editable={(active && fields?.citizenship?.isEditable) ?? false}
            control={(props) => <Input {...props} />}
            required={fields?.citizenship?.isRequired ?? false}
          />
        )}
        {fields?.nationality?.isVisible && (
          <Field
            state={state}
            name="nationality"
            label={t("DetailsPage.nationality")}
            editable={(active && fields?.nationality?.isEditable) ?? false}
            control={(props) => (
              <SearchInput {...props} options={nationalityOptions} />
            )}
            required={fields?.nationality?.isRequired ?? false}
          />
        )}
        {fields?.maritalStatus?.isVisible && (
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
            editable={(active && fields?.maritalStatus?.isEditable) ?? false}
            label={t("DetailsPage.marital-status")}
            name="maritalStatus"
            required={fields?.maritalStatus?.isRequired ?? false}
          />
        )}
        {fields?.placeOfBirth?.isVisible && (
          <Field
            state={state}
            name="placeOfBirth"
            editable={(active && fields?.placeOfBirth?.isEditable) ?? false}
            label={t("DetailsPage.place-of-birth")}
            control={(props) => <Input {...props} />}
            required={fields?.placeOfBirth?.isRequired ?? false}
          />
        )}

        {fields?.education?.isVisible && (
          <Field
            state={state}
            name="education"
            editable={(active && fields?.education?.isEditable) ?? false}
            label={t("DetailsPage.education")}
            control={(props) => (
              <SearchInput {...props} options={educationOptions} />
            )}
            required={fields?.education?.isRequired ?? false}
          />
        )}
        {fields?.mother?.isVisible && (
          <Field
            state={state}
            name="mother"
            editable={(active && fields?.mother?.isEditable) ?? false}
            label={t("DetailsPage.mothers-name")}
            control={(props) => <Input {...props} />}
            required={fields?.mother?.isRequired ?? false}
          />
        )}
        {fields?.father?.isVisible && (
          <Field
            state={state}
            name="father"
            editable={(active && fields?.father?.isEditable) ?? false}
            label={t("DetailsPage.fathers-name")}
            control={(props) => <Input {...props} />}
            required={fields?.father?.isRequired ?? false}
          />
        )}
        {fields?.phone?.isVisible && (
          <FieldGroup
            label={t("DetailsPage.phone")}
            required={fields?.phone?.isRequired ?? false}
          >
            {active && fields?.phone?.isEditable ? (
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
        {fields?.email?.isVisible && (
          <Field
            state={state}
            name="email"
            editable={(active && fields?.email?.isEditable) ?? false}
            label={t("DetailsPage.email")}
            control={(props) => <Input {...props} />}
            required={fields?.father?.isRequired ?? false}
          />
        )}

        {fields?.residenceSublocation?.isVisible && (
          <Field
            state={state}
            name="residenceSublocation"
            editable={
              (active && fields?.residenceSublocation?.isEditable) ?? false
            }
            label={t("DetailsPage.sublocation")}
            control={(props) => <Input {...props} />}
            required={fields?.residenceSublocation?.isRequired ?? false}
          />
        )}
        {fields?.residenceDistrict?.isVisible && (
          <Field
            state={state}
            name="residenceDistrict"
            editable={
              (active && fields?.residenceDistrict?.isEditable) ?? false
            }
            label={t("DetailsPage.district")}
            control={(props) => <Input {...props} />}
            required={fields?.residenceDistrict?.isRequired ?? false}
          />
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
