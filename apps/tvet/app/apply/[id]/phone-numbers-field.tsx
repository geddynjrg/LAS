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
import { Underline } from "@workspace/ui/components/underline";

export interface PhoneNumbersFieldProps {
  state: FormFieldState<{ phones: { callingCode: string; phone: string }[] }>;
}

export const PhoneNumbersField: FC<PhoneNumbersFieldProps> = ({ state }) => {
  const t = useTranslations("PhoneNumbersField");
  const [phonesIds, setPhonesIds] = useState(
    Array.from(Array(Math.max(state.values?.phones?.length ?? 0, 1)).keys()),
  );

  return phonesIds.map((id, index) => (
    <FieldGroup
      key={`phones-${id}`}
      className="relative"
      label={id === 0 ? t("phoneNumber") : undefined}
      required={id === 0}
      description={
        index === phonesIds.length - 1 ? (
          <Underline asChild className="typo-body-medium mt-4 cursor-pointer">
            <button
              type="button"
              onClick={() => setPhonesIds((v) => [...v, v.at(-1)! + 1])}
            >
              <IconPlus className="mr-1" /> {t("addAnotherPhoneNumber")}
            </button>
          </Underline>
        ) : null
      }
    >
      <Field
        state={state}
        name={`phones.${index}.callingCode`}
        className="max-w-40"
        required
        control={(props) => <CallingCodeSelect {...props} />}
      />
      <Field
        state={state}
        name={`phones.${index}.phone`}
        required
        control={(props) => (
          <Input
            type="tel"
            endDecorator={
              index > 0 ? (
                <Button
                  variant="ghost"
                  type="button"
                  size="xs"
                  onClick={() => setPhonesIds((v) => v.filter((i) => i !== id))}
                >
                  <IconX size={18} />
                </Button>
              ) : undefined
            }
            {...props}
          />
        )}
      />
    </FieldGroup>
  ));
};
