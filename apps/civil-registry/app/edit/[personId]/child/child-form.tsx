import { IconInfoSquareRounded } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { type FC, type ReactNode } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { PersonAge } from "@workspace/ui/components/civil-registry/person-age";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "@workspace/ui/hooks/use-form";
import { useFormSubmitted } from "@workspace/ui/hooks/use-form-submitted";
import { cn, isValueChanged } from "@workspace/ui/lib/utils";

import { childAction } from "@/app/edit/[personId]/child/child-action";
import { childSchema } from "@/app/edit/[personId]/child/child-schema";
import type { Person } from "@/lib/data/person";
import { getObjectDiff } from "@/lib/util/get-object-diff";

interface ChildFormBlockProps {
  defaultValues: Person;
  disabled: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onSubmit: (changedFields: Partial<Person>) => void;
}

export const ChildFormBlock: FC<ChildFormBlockProps> = ({
  disabled,
  defaultValues,
  isEditing,
  onEdit,
  onSubmit,
}) => {
  const t = useTranslations();
  const sexDisplayFormat = {
    M: t("DetailsPage.male"),
    F: t("DetailsPage.female"),
    I: t("DetailsPage.intersex"),
  };

  const [state, action, isPending] = useForm(
    childAction,
    childSchema,
    defaultValues,
  );

  useFormSubmitted(isPending, () => {
    if (!state.success) {
      return;
    }

    const changedFields = getObjectDiff(defaultValues, state?.values);

    onSubmit(changedFields);
  });

  const firstName = state.values?.firstName;
  const middleName = state.values?.middleName;
  const lastName = defaultValues.lastName;
  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const isNameChanged =
    isValueChanged("firstName", state.values, defaultValues) ||
    isValueChanged("middleName", state.values, defaultValues);

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
        description={t("DetailsPage.description")}
        disabled={disabled}
        active={isEditing}
        isPending={isPending}
        toggleEdit={onEdit}
      >
        <input
          type="hidden"
          name="natureOfBirth"
          value={state.values?.natureOfBirth}
        />
        {isEditing ? (
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
              description={t("DetailsPage.name-change-description")}
              control={(props) => <Input {...props} />}
            />

            <DataNode label={t("DetailsPage.surename")}>{lastName}</DataNode>
            <input type="hidden" name="lastName" value={lastName} />
          </>
        ) : (
          <DataNode
            label={t("DetailsPage.name")}
            variant={disabled ? "disabled" : "default"}
            isHighlighted={isNameChanged}
          >
            <input type="hidden" name="firstName" value={firstName} />
            <input type="hidden" name="middleName" value={middleName} />
            <input type="hidden" name="lastName" value={lastName} />

            {fullName ?? "–"}
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

        {!isEditing && (
          <DataNode label={t("DetailsPage.age")}>
            <PersonAge dob={state.values?.dob} autoFormat />
          </DataNode>
        )}

        <DataNode
          label={t("DetailsPage.sex")}
          variant={disabled ? "disabled" : "default"}
        >
          <input type="hidden" name="sex" value={state.values?.sex} />
          {state.values?.sex && sexDisplayFormat[state.values.sex]}
        </DataNode>
        <EditMessage>{t("DetailsPage.change-sex-message")}</EditMessage>
        <Field
          state={state}
          name="weightOnBirth"
          editable={false}
          label={t("DetailsPage.birth-weight")}
          control={(props) => <Input {...props} endDecorator="kg" />}
        />
        {state.values?.healthInstitution !== "OTHER" && (
          <Field
            state={state}
            name="healthInstitution"
            editable={false}
            label={t("DetailsPage.place-of-birth")}
            control={(props) => <Input {...props} />}
          />
        )}
        {state.values?.healthInstitution === "OTHER" && (
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
