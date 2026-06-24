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

type ColorVariant = "primary" | "civilRegistry";

export interface RadioOption<T extends string = string>
  extends VariantProps<typeof radioGroupVariants> {
  label: ReactNode;
  value: T;
  description?: ReactNode;
  limitedRole?: boolean;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string = string>
  extends VariantProps<typeof radioGroupVariants> {
  id?: string;
  name?: string;
  options?: RadioOption<T>[] | readonly RadioOption<T>[];
  limitedRole?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onValueChange?: (value: any) => void;
  className?: string;
  color?: ColorVariant;
  children?: ReactNode;
}

export const RadioGroup = <T extends string>({
  options,
  orientation = "vertical",
  size = "md",
  className,
  color = "primary",
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
      {options?.map(({ value, limitedRole, ...option }) => (
        <RadioGroupItem
          key={value}
          id={`${id}-${value}`}
          value={value}
          size={size}
          color={color}
          limitedRole={limitedRole}
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
    color: ColorVariant;
  }
> = ({ id, label, description, size, color, limitedRole, ...props }) => {
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="flex items-center">
      <RadioGroupPrimitive.Item
        id={id}
        className={cn(
          "border-foreground text-primary focus-visible-ring rounded-full border cursor-pointer",
          "disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" && "size-4",
          size === "md" && "size-6",
          size === "lg" && "size-8",
          color === "primary" && "data-[state=checked]:border-primary",
          color === "civilRegistry" &&
            "border-border data-[state=checked]:border-radio-secondary text-radio-secondary",
        )}
        aria-describedby={descriptionId}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <IconCircle
            className={cn(
              "fill-primary",
              size === "sm" && "size-3",
              size === "md" && "size-5",
              size === "lg" && "size-7",
              color === "civilRegistry" && "fill-radio-secondary",
            )}
          />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      <Label htmlFor={id} className="flex-1 pl-2 cursor-pointer">
        <div>{label}</div>
        {description && (
          <div id={descriptionId} className="typo-body-small text-foreground mt-1">
            {description}
          </div>
        )}
      </Label>
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
