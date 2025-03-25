import { IconInfoSquareRounded } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState, type FC, type ReactNode } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "@workspace/ui/hooks/use-form";
import { cn } from "@workspace/ui/lib/utils";

import { childAction } from "@/app/edit/[personId]/child/child-action";
import { childSchema } from "@/app/edit/[personId]/child/child-schema";
import type { Person } from "@/lib/data/person";

interface ChildFormBlockProps {
  defaultValues: Person;
  disabled: boolean;
  setRequirePayment: (value: boolean) => void;
  handleIsEditing: (id: string) => void;
}

export const ChildFormBlock: FC<ChildFormBlockProps> = ({
  disabled,
  defaultValues,
  setRequirePayment,
  handleIsEditing,
}) => {
  const t = useTranslations();
  const sexDisplayFormat = {
    M: t("DetailsPage.male"),
    F: t("DetailsPage.female"),
    I: t("DetailsPage.intersex"),
  };
  const [person, setPerson] = useState<Person>(defaultValues);
  const [toggleEdit, setToggleEdit] = useState<boolean>(false);

  const [state, action, isPending] = useForm(
    childAction,
    childSchema,
    defaultValues,
  );

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

          setRequirePayment(true);
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
        title={t(`DetailsPage.title-child`)}
        disabled={disabled}
        active={toggleEdit}
        toggleEdit={() => {
          handleIsEditing(toggleEdit ? "" : person.id);
          setToggleEdit(!toggleEdit);

          return null;
        }}
      >
        <input
          type="hidden"
          name="natureOfBirth"
          value={person?.natureOfBirth}
        />

        {toggleEdit ? (
          <>
            <Field
              state={state}
              name="firstName"
              editable={true}
              label={t("DetailsPage.first-name")}
              control={(props) => <Input {...props} />}
              required
            />

            <Field
              state={state}
              name="middleName"
              editable={true}
              label={t("DetailsPage.middle-name")}
              control={(props) => <Input {...props} />}
            />

            <input type="hidden" name="lastName" value={lastName} />
          </>
        ) : (
          <DataNode
            label={t("DetailsPage.name")}
            variant={disabled ? "disabled" : "default"}
          >
            <input type="hidden" name="firstName" value={firstName} />
            <input type="hidden" name="middleName" value={middleName} />
            <input type="hidden" name="lastName" value={lastName} />

            {fullName && fullName !== " " ? fullName : "–"}
          </DataNode>
        )}

        <Field
          state={state}
          name="dob"
          isDate
          editable={false}
          label={t("DetailsPage.dob")}
          control={(props) => <DatePicker {...props} />}
        />

        <EditMessage>{t("DetailsPage.change-dob-message")}</EditMessage>

        <DataNode
          label={t("DetailsPage.sex")}
          variant={disabled ? "disabled" : "default"}
        >
          <input type="hidden" name="sex" value={person.sex} />
          {person.sex && sexDisplayFormat[person.sex]}
        </DataNode>

        <EditMessage>{t("DetailsPage.change-sex-message")}</EditMessage>

        <Field
          state={state}
          name="weightOnBirth"
          editable={false}
          label={t("DetailsPage.birth-weight")}
          control={(props) => <Input {...props} endDecorator="kg" />}
        />

        {person?.healthInstitution !== "OTHER" && (
          <Field
            state={state}
            name="healthInstitution"
            editable={false}
            label={t("DetailsPage.health-institution")}
            control={(props) => <Input {...props} />}
          />
        )}

        {person?.healthInstitution === "OTHER" && (
          <>
            <Field
              state={state}
              name="healthInstitution"
              editable={false}
              label={t("DetailsPage.health-institution")}
              control={(props) => <Input {...props} />}
            />
            <Field
              state={state}
              name="birthSublocation"
              editable={false}
              label={t("DetailsPage.sublocation")}
              control={(props) => <Input {...props} />}
            />
            <Field
              state={state}
              name="birthSublocationDistrict"
              editable={false}
              label={t("DetailsPage.district")}
              control={(props) => <Input {...props} />}
            />
          </>
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
