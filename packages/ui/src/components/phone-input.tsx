import { useState, type FC } from "react";

import { FlagSelect } from "@workspace/ui/components/flag-select";
import { Input } from "@workspace/ui/components/input";
import { InputGroup } from "@workspace/ui/components/input-group";
import { countries } from "@workspace/ui/lib/countries";

export interface PhoneInputProps {
  id?: string;
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  className?: string;
}

export const PhoneInput: FC<PhoneInputProps> = ({
  id,
  name,
  defaultValue,
  disabled,
  className,
}) => {
  const defaultCallingCode = parseCallingCode(defaultValue);
  const defaultPhoneNumber = defaultValue
    // remove leading `+`
    ?.replace(/^\+/, "")
    // remove calling code
    ?.slice(defaultCallingCode?.length);

  const [callingCode, setCallingCode] = useState(defaultCallingCode);
  const [phoneNumber, setPhoneNumber] = useState(defaultPhoneNumber);

  const value = [callingCode, phoneNumber].join("");

  return (
    <>
      <input type="hidden" name={name} value={value} />

      <InputGroup className={className}>
        <FlagSelect
          className="max-w-40"
          options={options}
          onChange={setCallingCode}
          defaultValue={defaultCallingCode}
        />

        <Input
          id={id}
          placeholder="Phone number"
          type="tel"
          disabled={disabled}
          defaultValue={defaultPhoneNumber}
          onValueChange={setPhoneNumber}
        />
      </InputGroup>
    </>
  );
};

const options = countries.map((country) => ({
  value: country.callingCode,
  code: country.iso2,
  label: `(+${country.callingCode}) ${country.name}`,
  labelShort: `+${country.callingCode}`,
}));

function parseCallingCode(value?: string) {
  if (!value) {
    return undefined;
  }

  const cleanedValue = value
    // remove leading `+`
    .replace(/^\+/, "")
    // remove spaces
    .replace(" ", "");

  return options.find((option) => cleanedValue.startsWith(option.value))?.value;
}
