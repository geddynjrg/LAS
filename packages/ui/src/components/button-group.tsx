import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type { VariantProps } from "cva-extended";
import { Check } from "lucide-react";
import { createContext, useContext, type FC, type ReactNode } from "react";

import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export const buttonGroupVariants = buttonVariants;

const ButtonGroupContext = createContext<
  VariantProps<typeof buttonGroupVariants>
>({
  size: "default",
  variant: "secondary",
});

export type ButtonGroupProps = VariantProps<typeof buttonGroupVariants> & {
  disabled?: boolean;
  className?: string;
  children: ReactNode;
} & (
    | {
        type: "single";
        value?: string;
        defaultValue?: string;
        onValueChange?(value: string): void;
      }
    | {
        type: "multiple";
        value?: string[];
        defaultValue?: string[];
        onValueChange?(value: string[]): void;
      }
  );

export const ButtonGroup: FC<ButtonGroupProps> = ({
  className,
  variant,
  size,
  children,
  ...props
}) => {
  return (
    <ToggleGroupPrimitive.Root
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <ButtonGroupContext.Provider value={{ variant, size }}>
        {children}
      </ButtonGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
};

export interface ToggleGroupItemProps
  extends VariantProps<typeof buttonGroupVariants> {
  value: string;
  asChild?: boolean;
  className?: string;
  children: ReactNode;
}

export const ButtonGroupItem: FC<ToggleGroupItemProps> = ({
  className,
  children,
  variant,
  size,
  ...props
}) => {
  const context = useContext(ButtonGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        buttonVariants({
          variant: context.variant || variant,
          size: context.size || size,
          className,
        }),
        "not-last:border-r-0 group rounded-none first:rounded-l-full last:rounded-r-full",
        className,
      )}
      {...props}
    >
      <Check className="hidden group-data-[state=on]:inline" />
      {children}
    </ToggleGroupPrimitive.Item>
  );
};
