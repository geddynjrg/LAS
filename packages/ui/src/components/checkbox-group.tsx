import { useEffect, useState, type ReactNode } from "react";

import {
  Checkbox,
  type CheckboxProps,
} from "@workspace/ui/components/checkbox";
import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const checkboxGroupVariants = cva({
  base: "my-2 flex flex-wrap gap-4",
  variants: {
    orientation: {
      horizontal: "my-0 mb-2 flex-row",
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
  value?: T | T[];
  defaultValue?: T | T[];
  onValueChange?: (value: T[]) => void;
  className?: string;
}

// export const CheckboxGroup = <T extends string>({
//   id,
//   name,
//   options,
//   value: valueProp,
//   defaultValue,
//   orientation = "vertical",
//   size,
//   className,
//   onValueChange,
//   ...props
// }: CheckboxGroupProps<T>) => {
//   const [value, setValue] = useState<T[]>(
//     Array.isArray(valueProp)
//       ? valueProp
//       : Array.isArray(defaultValue)
//         ? defaultValue
//         : (defaultValue?.split(",") as T[]),
//   );

//   useEffect(() => {
//     if (valueProp && value !== valueProp) {
//       setValue(Array.isArray(valueProp) ? valueProp : [valueProp]);
//     }
//   }, [value, valueProp]);

//   function handleChange(checked: boolean, option: CheckboxGroupOption<T>) {
//     setValue((prev) => {
//       const newVal = checked
//         ? [...(prev ?? []), option.value]
//         : (prev ?? []).filter((v) => v !== option.value);

//       onValueChange?.(newVal);

//       return newVal;
//     });
//   }

//   return (
//     <fieldset
//       className={cn(
//         checkboxGroupVariants({ orientation, className }),
//       )}
//       role="group"
//       aria-labelledby={id ? `${id}-legend` : undefined}
//       {...props}
//     >
//       <input type="hidden" name={name} value={value?.join(",")} />

//       {options?.map((option) => (
//         <Checkbox
//           key={`${id}-${option.value}`}
//           size={size}
//           defaultValue={value?.includes(option.value) ?? false}
//           onValueChange={(checked) => handleChange(checked, option)}
//         >
//           {option.label}
//         </Checkbox>
//       ))}
//     </fieldset>
//   );
// };

export const CheckboxGroup = <T extends string>({
  id,
  name,
  options,
  value: valueProp,
  defaultValue,
  orientation = "vertical",
  size,
  className,
  onValueChange,
  ...props
}: CheckboxGroupProps<T>) => {
  const [value, setValue] = useState<T[]>(
    Array.isArray(valueProp)
      ? valueProp
      : Array.isArray(defaultValue)
        ? defaultValue
        : (defaultValue?.split(",").filter(Boolean) as T[]) ?? []
  );

  useEffect(() => {
    if (valueProp !== undefined) {
      setValue(Array.isArray(valueProp) ? valueProp : (valueProp ? [valueProp] : []));
    }
  }, [valueProp]);

  function handleChange(checked: boolean, option: CheckboxGroupOption<T>) {
    setValue((prev) => {
      const newVal = checked
        ? [...prev, option.value]
        : prev.filter((v) => v !== option.value);

      onValueChange?.(newVal);
      return newVal;
    });
  }

  return (
    <fieldset
      className={cn(checkboxGroupVariants({ orientation, className }))}
      role="group"
      aria-labelledby={id ? `${id}-legend` : undefined}
      {...props}
    >
      <input type="hidden" name={name} value={value?.join(",")} />

      {options?.map((option) => (
        <Checkbox
          key={`${id}-${option.value}`}
          size={size}
          defaultValue={value.includes(option.value) ? "on" : undefined} // Use defaultValue with "on" string
          onValueChange={(checked) => handleChange(checked, option)}
        >
          {option.label}
        </Checkbox>
      ))}
    </fieldset>
  );
};