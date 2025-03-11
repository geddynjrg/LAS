import { useState, type ReactNode } from "react";

import {
  Checkbox,
  type CheckboxProps,
} from "@workspace/ui/components/checkbox";
import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const checkboxGroupVariants = cva({
  base: "my-2 flex flex-wrap gap-4",
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export interface CheckboxGroupOption<T extends string = string> {
  label: ReactNode;
  value: T;
}

export interface CheckboxGroupProps<T extends string = string>
  extends VariantProps<typeof checkboxGroupVariants> {
  id?: string;
  name?: string;
  options?: CheckboxGroupOption<T>[];
  size?: CheckboxProps["size"];
  defaultValue?: T | T[];
  onValueChange?: (value: T[]) => void;
  className?: string;
}

export const CheckboxGroup = <T extends string>({
  id,
  name,
  options,
  defaultValue,
  orientation = "vertical",
  size,
  className,
}: CheckboxGroupProps<T>) => {
  const [value, setValue] = useState(
    Array.isArray(defaultValue) ? defaultValue : defaultValue?.split(","),
  );

  function handleChange(checked: boolean, option: CheckboxGroupOption<T>) {
    setValue((prev) =>
      checked
        ? [...(prev ?? []), option.value]
        : (prev ?? []).filter((v) => v !== option.value),
    );
  }

  return (
    <div className={cn(checkboxGroupVariants({ orientation, className }))}>
      <input type="hidden" name={name} value={value?.join(",")} />

      {options?.map((option) => (
        <Checkbox
          key={`${id}-${option.value}`}
          size={size}
          defaultValue={value?.includes(option.value) ?? false}
          onValueChange={(checked) => handleChange(checked, option)}
        >
          {option.label}
        </Checkbox>
      ))}
    </div>
  );
};
