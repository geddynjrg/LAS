import { useTranslations } from "next-intl";
import { type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";
import { useFormSubmitted } from "@workspace/ui/hooks/use-form-submitted";

import { motherAction } from "@/app/edit/[personId]/mother/mother-action";
import { motherSchema } from "@/app/edit/[personId]/mother/mother-schema";
import { ContactFields } from "@/components/contact-fields";
import { educationOptions } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";
import { getObjectDiff } from "@/lib/util/get-object-diff";
import { nationalities } from "@/lib/util/nationalities";

interface MotherFormBlockProps {
  defaultValues: Person;
  disabled: boolean;
  isEditing?: boolean;
  onEdit: () => void;
  onSubmit: (changedFields: Partial<Person>) => void;
}

export const MotherFormBlock: FC<MotherFormBlockProps> = ({
  disabled,
  defaultValues,
  isEditing,
  onEdit,
  onSubmit,
}) => {
  const t = useTranslations();

  const [state, action, isPending] = useForm(
    motherAction,
    motherSchema,
    defaultValues,
  );

  useFormSubmitted(isPending, () => {
    if (!state.success) {
      return;
    }

    const changedFields = getObjectDiff(defaultValues, state?.values);

    onSubmit(changedFields);
  });

  const firstName = defaultValues?.firstName ?? "";
  const lastName = defaultValues?.lastName ?? "";
  const middleName = defaultValues?.middleName ?? "";

  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

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
        active={isEditing}
        toggleEdit={onEdit}
      >
        <Field
          state={state}
          editable={false}
          name="nationalId"
          label={t("DetailsPage.national-id")}
          control={(props) => <Input {...props} />}
        />
        <DataNode
          label={t("DetailsPage.name")}
          variant={disabled ? "disabled" : "default"}
        >
          <input type="hidden" name="firstName" value={firstName} />
          <input type="hidden" name="middleName" value={middleName} />
          <input type="hidden" name="lastName" value={lastName} />

          {fullName ?? "–"}
        </DataNode>

        <Field
          state={state}
          name="dob"
          isDate
          editable={false}
          label={t("DetailsPage.dob")}
          control={(props) => <DatePicker {...props} />}
        />

        <input type="hidden" name="sex" value={state.values?.sex} />
        <Field
          state={state}
          name="citizenship"
          label={t("DetailsPage.citizenship")}
          editable={false}
          control={(props) => <Input {...props} />}
        />

        <Field
          state={state}
          name="nationality"
          label={t("DetailsPage.nationality")}
          editable={isEditing}
          control={(props) => (
            <SearchInput {...props} options={nationalityOptions} />
          )}
          required={isEditing}
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
          editable={isEditing}
          label={t("DetailsPage.marital-status")}
          name="maritalStatus"
          required={isEditing}
        />

        <Field
          state={state}
          name="education"
          editable={isEditing}
          label={t("DetailsPage.education")}
          control={(props) => (
            <SearchInput {...props} options={educationOptions} />
          )}
          required={isEditing}
        />

        <Field
          state={state}
          name="fatherName"
          editable={isEditing}
          label={t("DetailsPage.fathers-name")}
          control={(props) => <Input {...props} />}
        />

        <ContactFields state={state} editable={isEditing} hasEmail={false} />
      </DataBlock>
    </Form>
  );
};
