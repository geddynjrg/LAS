"use client";

import {
  useCallback,
  useMemo,
  useState,
  useTransition,
  type FC,
  type ReactNode,
} from "react";

import { Flag } from "@workspace/ui/components/flag";
import { Select, type SelectProps } from "@workspace/ui/components/select";

export interface FlagSelectProps<T extends string>
  extends Omit<SelectProps<T>, "disabled" | "options"> {
  onChange?: (value: T) => Promise<void> | void;
  options: {
    label: ReactNode;
    value: T;
    code: string;
    labelShort?: ReactNode;
  }[];
}

export const FlagSelect = <T extends string>({
  options,
  onChange,
  defaultValue,
  ...props
}: FlagSelectProps<T>) => {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  const selectedOption = useMemo(
    () => options?.find((item) => item.value === value),
    [options, value],
  );

  const optionsWithFlags = useMemo(
    () =>
      options?.map((item) => ({
        ...item,
        label: (
          <LabelWithFlag label={item.label} code={item.code ?? item.value} />
        ),
      })),
    [options],
  );

  const handleChange = useCallback(
    (value: T) => {
      setValue(value);

      startTransition(() => {
        onChange?.(value);
      });
    },
    [onChange],
  );

  return (
    <Select
      onValueChange={handleChange}
      options={optionsWithFlags}
      disabled={isPending}
      selectedLabel={
        value ? (
          <LabelWithFlag
            label={selectedOption?.labelShort ?? selectedOption?.label}
            code={selectedOption?.code ?? value}
          />
        ) : undefined
      }
      {...props}
    />
  );
};

const LabelWithFlag: FC<{ label: ReactNode; code: string }> = ({
  label,
  code,
}) => (
  <span className="flex items-center gap-2">
    <Flag code={code} />

    {label}
  </span>
);
