import { IconCaretDownFilled } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Divider } from "@workspace/ui/components/divider";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, FieldGroup, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";
import { useFormSubmitted } from "@workspace/ui/hooks/use-form-submitted";
import { cn, formatBytes } from "@workspace/ui/lib/utils";

import { fatherAction } from "@/app/edit/[personId]/father/father-action";
import { fatherSchema } from "@/app/edit/[personId]/father/father-schema";
import { ContactFields } from "@/components/contact-fields";
import { NationalIdFields } from "@/components/national-id-fields";
import { FILE_ACCEPT, MAX_FILE_SIZE } from "@/lib/constants";
import type { Person } from "@/lib/data/person";
import { getObjectDiff } from "@/lib/util/get-object-diff";
import { nationalities } from "@/lib/util/nationalities";

interface FatherFormBlockProps {
  defaultValues: Person;
  disabled: boolean;
  isEditing?: boolean;
  onEdit: () => void;
  onSubmit: (changedFields: Partial<Person>) => void;
}

export const FatherFormBlock: FC<FatherFormBlockProps> = ({
  disabled,
  defaultValues,
  isEditing,
  onEdit,
  onSubmit,
}) => {
  const t = useTranslations();

  const [state, action, isPending] = useForm(
    fatherAction,
    fatherSchema,
    defaultValues,
  );

  const nationalityOptions = nationalities.map((nationality) => ({
    label: nationality,
    value: nationality,
  }));

  const firstName = defaultValues?.firstName ?? "";
  const lastName = defaultValues?.lastName ?? "";
  const middleName = defaultValues?.middleName ?? "";

  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  useFormSubmitted(isPending, () => {
    if (!state.success) {
      return;
    }

    const changedFields = getObjectDiff(defaultValues, state?.values);

    onSubmit(changedFields);
  });

  return (
    <Form className="space-y-6" action={action}>
      <Field state={state} name="id" isVisible={false} control={null} />
      <Field state={state} name="sex" isVisible={false} control={null} />

      <DataBlock
        title={t(`DetailsPage.title-father`)}
        disabled={disabled}
        active={isEditing}
        toggleEdit={onEdit}
      >
        {isEditing && (
          <Alert
            position="local"
            title={t("DetailsPage.affidavit-required")}
            variant="warning"
          >
            {t("DetailsPage.affidavit-required-text")}
          </Alert>
        )}
        {isEditing && (
          <NationalIdFields
            searchSexFilter="M"
            state={state}
            defaultValues={defaultValues}
            editable={isEditing}
          />
        )}

        {!isEditing && (
          <>
            <DataNode
              label={t("DetailsPage.name")}
              variant={disabled ? "disabled" : "default"}
            >
              <input type="hidden" name="firstName" value={firstName} />
              <input type="hidden" name="middleName" value={middleName} />
              <input type="hidden" name="lastName" value={lastName} />

              {fullName ?? "–"}
            </DataNode>
            {defaultValues?.nationalId && (
              <Field
                state={state}
                editable={false}
                name="nationalId"
                label={t("DetailsPage.national-id")}
                control={(props) => <Input {...props} />}
              />
            )}

            {defaultValues?.nationalId && (
              <Field
                state={state}
                name="dob"
                isDate
                label={t("DetailsPage.dob")}
                control={(props) => <DatePicker {...props} />}
                editable={false}
              />
            )}

            {!defaultValues?.nationalId && (
              <Field
                state={state}
                name="age"
                label={t("DetailsPage.age")}
                control={(props) => <Input {...props} />}
                editable={false}
              />
            )}

            <input type="hidden" name="sex" value={state.values?.sex} />

            <input
              type="hidden"
              name="citizenship"
              value={state.values?.citizenship}
            />
            {/* <Field
              state={state}
              name="citizenship"
              label={t("DetailsPage.citizenship")}
              editable={false}
              control={(props) => <Input {...props} />}
            /> */}

            <Field
              state={state}
              defaultValues={defaultValues}
              name="nationality"
              label={t("DetailsPage.nationality")}
              editable={isEditing}
              control={(props) => (
                <SearchInput {...props} options={nationalityOptions} />
              )}
              required={isEditing}
            />
          </>
        )}

        {/* <Field
          state={state}
          defaultValues={defaultValues}
          name="education"
          editable={isEditing}
          label={t("DetailsPage.education")}
          control={(props) => (
            <SearchInput
              {...props}
              options={educationOptions}
              endDecorator={<IconCaretDownFilled />}
            />
          )}
          required={isEditing}
        /> */}
        <input type="hidden" name="education" value={state.values?.education} />
        <ContactFields
          state={state}
          defaultValues={defaultValues.contacts}
          editable={isEditing}
          hasEmail={false}
        />
        {isEditing && (
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
              description={t("Common.maxFileSize", {
                size: formatBytes(MAX_FILE_SIZE),
              })}
              control={(props) => (
                <FileUploadInput
                  accept={FILE_ACCEPT}
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
        {!isEditing && state.values?.affidavit && (
          <FieldGroup label={t("DetailsPage.affidavit")}>
            <p>{state.values?.affidavit}</p>
          </FieldGroup>
        )}
      </DataBlock>
    </Form>
  );
};
