import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { IconCircle } from "@tabler/icons-react";
import { useId, type FC, type ReactNode } from "react";

import { Label } from "@workspace/ui/components/label";
import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const radioGroupVariants = cva({
  base: "flex gap-2",
  variants: {
    size: {
      sm: "",
      md: "",
      lg: "",
    },
    orientation: {
      horizontal: "flex-row flex-wrap gap-x-4",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    size: "md",
  },
});

export interface RadioOption<T extends string = string>
  extends VariantProps<typeof radioGroupVariants> {
  label: ReactNode;
  value: T;
}

export interface RadioGroupProps<T extends string = string>
  extends VariantProps<typeof radioGroupVariants> {
  id?: string;
  name?: string;
  options?: RadioOption<T>[] | readonly RadioOption<T>[];
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  className?: string;
  children?: ReactNode;
}

export const RadioGroup = <T extends string>({
  options,
  orientation = "vertical",
  size = "md",
  className,
  ...props
}: RadioGroupProps<T>) => {
  const defaultId = useId();
  const id = props.id ?? defaultId;

  return (
    <RadioGroupPrimitive.Root
      id={id}
      className={cn(radioGroupVariants({ orientation, size }), className)}
      {...props}
      ref={ignoreSetCustomValidityError}
    >
      {options?.map(({ value, ...option }) => (
        <RadioGroupItem
          key={value}
          id={`${id}-${value}`}
          value={value}
          size={size}
          {...option}
        />
      ))}
    </RadioGroupPrimitive.Root>
  );
};

const RadioGroupItem: FC<
  RadioOption & {
    id: string;
    size: VariantProps<typeof radioGroupVariants>["size"];
  }
> = ({ id, label, size, ...props }) => {
  return (
    <div className="flex items-center space-x-2">
      <RadioGroupPrimitive.Item
        id={id}
        className={cn(
          "border-foreground text-primary focus-visible-ring rounded-full border",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:border-primary",
          size === "sm" && "size-4",
          size === "md" && "size-6",
          size === "lg" && "size-8",
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <IconCircle
            className={cn(
              "fill-primary",
              size === "sm" && "size-3",
              size === "md" && "size-5",
              size === "lg" && "size-7",
            )}
          />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
};

// Radix Radiogroup does not work with Radix form validation yet
// https://stackoverflow.com/questions/77714493/how-to-fix-unhandled-runtime-error-typeerror-control-setcustomvalidity-in-nextj
function ignoreSetCustomValidityError(elem: HTMLDivElement | null) {
  if (elem) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elem as any).setCustomValidity = () => {};
  }
}
