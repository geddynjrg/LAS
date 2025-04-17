"use client";

import { IconPlus, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { CallingCodeSelect } from "@workspace/ui/components/calling-code-select";
import {
  Field,
  FieldGroup,
  type FormFieldState,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

import { UnderlineButton } from "@/components/underline-button";

export interface ContactFieldContact {
  phoneCode: string;
  phone: string;
  email?: string;
}

export interface ContactFieldsProps {
  state: FormFieldState<{
    contacts: ContactFieldContact[];
  }>;
  defaultValues?: Partial<ContactFieldContact>[];
  editable?: boolean;
  hasEmail?: boolean;
}

export const ContactFields: FC<ContactFieldsProps> = ({
  state,
  defaultValues,
  editable = true,
  hasEmail = true,
}) => {
  const t = useTranslations("DetailsPage");
  const defaultState = state.values?.contacts?.map(
    (_contact, index) => index,
  ) ?? [0];

  const [contactIds, setContactIds] = useState(defaultState);

  const addContact = () => {
    setContactIds((value) => [...value, value.at(-1)! + 1]);
  };

  const removeContact = (index: number) => {
    setContactIds((prev) => prev.filter((id) => id !== index));
  };

  if (!editable) {
    return state.values?.contacts?.map((contact, index) => (
      <div key={`phone-contact-${index}`}>
        <input
          type="hidden"
          name={`contacts.${index}.phoneCode`}
          value={contact?.phoneCode}
        />
        <input
          type="hidden"
          name={`contacts.${index}.phone`}
          value={contact?.phone}
        />
        {contact.email && (
          <input
            type="hidden"
            name={`contacts.${index}.email`}
            value={contact.email}
          />
        )}
        <FieldGroup
          label={t("phone")}
          key={`phone-${index}-${contact.phoneCode}-${contact.phone}`}
          required={editable}
          isHighlighted={isValueChanged(defaultValues, contact, index)}
        >
          +{contact?.phoneCode} {contact?.phone}
        </FieldGroup>
        {contact.email && (
          <FieldGroup label={t("email")} className="mt-2">
            {contact.email}
          </FieldGroup>
        )}
      </div>
    ));
  }

  return (
    <>
      {contactIds.map((id, index) => (
        <div
          key={`phone-contact-${id}`}
          className={cn(
            "relative",
            id > 0 && "border-t border-neutral-400 pt-4",
          )}
        >
          <FieldGroup label={t("phone")} required>
            <Field
              state={state}
              name={`contacts.${index}.phoneCode`}
              className="max-w-40"
              required
              control={(props) => <CallingCodeSelect {...props} />}
            />
            <Field
              state={state}
              name={`contacts.${index}.phone`}
              required
              control={(props) => (
                <Input type="tel" {...props} placeholder="000 000000" />
              )}
            />
          </FieldGroup>
          {hasEmail && (
            <Field
              className="mt-4"
              state={state}
              name={`contacts.${index}.email`}
              label={t("email")}
              control={(props) => (
                <Input {...props} placeholder="email@email.com" />
              )}
            />
          )}

          {id > 0 && (
            <Button
              variant="ghost"
              type="button"
              className="z-1 absolute right-0 top-2 px-1 py-0"
              onClick={() => removeContact(id)}
            >
              <IconX size={18} />
            </Button>
          )}
        </div>
      ))}

      <UnderlineButton className="mx-auto" onClick={addContact}>
        <IconPlus />
        {t("add-another-contact")}
      </UnderlineButton>
    </>
  );
};

function isValueChanged<T extends ContactFieldContact>(
  defaultValues: Partial<T>[] | undefined | null,
  currentValue: T | undefined | null,
  index: number,
) {
  if (!defaultValues) {
    return false;
  }

  if (index >= defaultValues.length) {
    return true;
  }

  const defaultCode = defaultValues[index]?.phoneCode ?? "";
  const defaultPhone = defaultValues[index]?.phone ?? "";
  const defaultEmail = defaultValues[index]?.email ?? "";
  const currentCode = currentValue?.phoneCode ?? "";
  const currentPhone = currentValue?.phone ?? "";
  const currentEmail = currentValue?.email ?? "";

  return (
    defaultCode !== currentCode ||
    defaultPhone !== currentPhone ||
    defaultEmail !== currentEmail
  );
}
