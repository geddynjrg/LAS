import { IconPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState, type FC } from "react";

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
  const [phonesCount, setPhonesCount] = useState(
    Math.max(state.values?.phones?.length ?? 0, 1),
  );

  return Array.from({ length: phonesCount }).map((_, i) => (
    <FieldGroup
      key={`phones-${i}`}
      label={t("phoneNumber")}
      required={i === 0}
      description={
        i === phonesCount - 1 ? (
          <Underline asChild className="typo-body-medium cursor-pointer">
            <button type="button" onClick={() => setPhonesCount((v) => v + 1)}>
              <IconPlus className="mr-1" /> {t("addAnotherPhoneNumber")}
            </button>
          </Underline>
        ) : null
      }
    >
      <Field
        state={state}
        name={`phones.${i}.callingCode`}
        className="max-w-40"
        required
        control={(props) => <CallingCodeSelect {...props} />}
      />
      <Field
        state={state}
        name={`phones.${i}.phone`}
        required
        control={(props) => <Input type="tel" {...props} />}
      />
    </FieldGroup>
  ));
};
