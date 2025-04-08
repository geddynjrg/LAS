import { useEffect, useMemo, useState, type FC, type ReactNode } from "react";

import { Flag } from "@workspace/ui/components/flag";
import { Select } from "@workspace/ui/components/select";
import { countries } from "@workspace/ui/lib/countries";

export interface CallingCodeSelectProps {
  id?: string;
  name?: string;
  defaultValue?: string;
  onValueChange?: (value?: string) => void;
  className?: string;
}

export const CallingCodeSelect: FC<CallingCodeSelectProps> = ({
  name,
  defaultValue,
  onValueChange,
  ...props
}) => {
  const options = useMemo(
    () =>
      countries.map((country) => ({
        value: country.iso2,
        label: (
          <LabelWithFlag
            code={country.iso2}
          >{`(+${country.callingCode}) ${country.name}`}</LabelWithFlag>
        ),
        callingCode: country.callingCode,
      })),
    [],
  );

  const [value, setValue] = useState(
    // find default value in options or fallback to KE
    options.find((item) => item.callingCode === defaultValue)?.value ?? "KE",
  );

  const selectedOption = useMemo(
    () => options.find((item) => item.value === value),
    [options, value],
  );

  // call onValueChange when the selected option changes
  useEffect(() => {
    onValueChange?.(selectedOption?.callingCode);
  }, [onValueChange, selectedOption?.callingCode]);

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={selectedOption?.callingCode ?? ""}
      />
      <Select
        value={value}
        onValueChange={setValue}
        options={options}
        selectedLabel={
          selectedOption && (
            <LabelWithFlag
              code={value}
            >{`+${selectedOption.callingCode}`}</LabelWithFlag>
          )
        }
        {...props}
      />
    </>
  );
};

const LabelWithFlag: FC<{ code?: string; children: ReactNode }> = ({
  code,
  children,
}) => (
  <span className="flex items-center gap-2">
    {code && <Flag code={code} />}

    {children}
  </span>
);
