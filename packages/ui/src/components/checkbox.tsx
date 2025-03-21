import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { IconCheck } from "@tabler/icons-react";
import { memo, useId, useState, type FC, type ReactNode } from "react";

import { Label, labelVariants } from "@workspace/ui/components/label";
import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const checkboxVariants = cva({
  base: "border-primary bg-primary-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible-ring shrink-0 rounded-sm border disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    size: {
      sm: "peer h-4 w-4",
      default: "peer h-6 w-6",
      lg: "peer h-8 w-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface CheckboxProps extends VariantProps<typeof checkboxVariants> {
  id?: string;
  name?: string;
  defaultValue?: "on" | null | boolean | undefined | string;
  onValueChange?: (checked: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  children?: ReactNode;
  className?: string;
}

export const Checkbox: FC<CheckboxProps> = ({
  id,
  size,
  className,
  defaultValue,
  children,
  onValueChange,
  ...props
}) => {
  const componentId = useId();
  const [value, setValue] = useState(isChecked(defaultValue));

  function handleChange(checked: boolean | string) {
    const newValue = isChecked(checked);

    onValueChange?.(newValue);
    setValue(newValue);
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <CheckboxRootWrapper
        className={checkboxVariants({ size })}
        id={id || componentId}
        checked={value}
        onCheckedChange={handleChange}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <IconCheck className="size-full" />
        </CheckboxPrimitive.Indicator>
      </CheckboxRootWrapper>

      {children && (
        <Label htmlFor={id || componentId} className={labelVariants({ size })}>
          {children}
        </Label>
      )}
    </div>
  );
};

// fixes loosing default value after form submit
const CheckboxRootWrapper: FC<
  React.ComponentProps<typeof CheckboxPrimitive.Root>
> = (props) => {
  const MemoizedRoot = memo(CheckboxPrimitive.Root);

  return <MemoizedRoot {...props} />;
};

function isChecked(checked?: boolean | string | null) {
  if (typeof checked === "boolean") {
    return checked;
  }

  return checked === "on";
}
