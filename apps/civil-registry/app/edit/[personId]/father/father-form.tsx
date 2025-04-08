import { useTranslations } from "next-intl";
import { type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { Divider } from "@workspace/ui/components/divider";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, FieldGroup, Form } from "@workspace/ui/components/form";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";
import { useFormSubmitted } from "@workspace/ui/hooks/use-form-submitted";
import { cn, formatBytes } from "@workspace/ui/lib/utils";

import { fatherAction } from "@/app/edit/[personId]/father/father-action";
import { fatherSchema } from "@/app/edit/[personId]/father/father-schema";
import { ContactFields } from "@/components/contact-fields";
import { NationalIdFields } from "@/components/national-id-fields";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { educationOptions } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/data/person";
import { getObjectDiff } from "@/lib/util/get-object-diff";

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

        <NationalIdFields
          searchSexFilter="M"
          state={state}
          defaultValues={defaultValues}
          editable={isEditing}
        />

        <Field
          state={state}
          defaultValues={defaultValues}
          name="education"
          editable={isEditing}
          label={t("DetailsPage.education")}
          control={(props) => (
            <SearchInput {...props} options={educationOptions} />
          )}
          required={isEditing}
        />

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

        {!isEditing && state.values?.affidavit && (
          <FieldGroup label={t("DetailsPage.affidavit")}>
            <p>{state.values?.affidavit}</p>
          </FieldGroup>
        )}
      </DataBlock>
    </Form>
  );
};
