"use client";

import { cva, type VariantProps } from "cva-extended";
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

export const flagSelectVariants = cva({
  base: "",
  variants: {
    variant: {
      dropdown: "",
      list: "",
    },
  },
  defaultVariants: {
    variant: "dropdown",
  },
});

interface FlagOption<T = string> {
  label: ReactNode;
  value: T;
  labelShort?: ReactNode;
}

export interface FlagSelectProps<T extends string>
  extends Omit<SelectProps<T>, "disabled" | "options">,
    VariantProps<typeof flagSelectVariants> {
  onChange?: (value: T) => Promise<void> | void;
  options: readonly FlagOption<T>[];
}

export const FlagSelect = <T extends string>({
  options,
  variant,
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
        label: <LabelWithFlag label={item.label} code={item.value} />,
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

  if (variant === "list") {
    return (
      <FlagList
        value={value}
        onChange={handleChange}
        optionsWithFlags={optionsWithFlags}
        isPending={isPending}
      />
    );
  }

  return (
    <Select
      onValueChange={handleChange}
      options={optionsWithFlags}
      disabled={isPending}
      selectedLabel={
        value ? (
          <LabelWithFlag
            label={selectedOption?.labelShort ?? selectedOption?.label}
            code={selectedOption?.value ?? value}
          />
        ) : undefined
      }
      {...props}
    />
  );
};

interface FlagListProps<T extends string> {
  value?: T;
  onChange?: (value: T) => void;
  optionsWithFlags: { label: ReactNode; value: T }[] | undefined;
  isPending: boolean;
}

const FlagList = <T extends string>({
  value,
  onChange,
  optionsWithFlags,
  isPending,
}: FlagListProps<T>) => {
  return (
    <ul className="flex gap-4">
      {optionsWithFlags?.map((item) => (
        <li key={item.value}>
          <button
            onClick={() => onChange?.(item.value)}
            disabled={isPending}
            data-active={value === item.value}
            className="flex items-center gap-2 hover:cursor-pointer hover:underline data-[active=true]:underline"
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
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
