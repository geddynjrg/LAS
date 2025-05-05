/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { IconCheck } from "@tabler/icons-react";
import type { VariantProps } from "cva-extended";
import {
  createContext,
  useContext,
  useState,
  type FC,
  type ReactNode,
} from "react";

import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export const buttonGroupVariants = buttonVariants;

const ButtonGroupContext = createContext<
  VariantProps<typeof buttonGroupVariants>
>({});

export type ButtonGroupProps = VariantProps<typeof buttonGroupVariants> & {
  name?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  "aria-invalid"?: boolean;
  "data-invalid"?: boolean;
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
  name,
  defaultValue,
  variant = "secondary",
  size,
  className,
  children,
  onValueChange,
  ...props
}) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={Array.isArray(value) ? value.join(",") : value || ""}
      />
      <ToggleGroupPrimitive.Root
        className={cn("flex items-center justify-center", className)}
        value={value as any}
        onValueChange={(value: any) => {
          setValue(value);
          onValueChange?.(value);
        }}
        {...props}
      >
        <fieldset
          name={name}
          aria-invalid={props["aria-invalid"]}
          data-invalid={props["data-invalid"]}
          className={cn("flex w-full items-center justify-center")}
        >
          <ButtonGroupContext.Provider value={{ variant, size }}>
            {children}
          </ButtonGroupContext.Provider>
        </fieldset>
      </ToggleGroupPrimitive.Root>
    </>
  );
};

export interface ToggleGroupItemProps
  extends VariantProps<typeof buttonGroupVariants> {
  value: string;
  asChild?: boolean;
  className?: string;
  enableIcon?: boolean;
  children: ReactNode;
}

export const ButtonGroupItem: FC<ToggleGroupItemProps> = ({
  className,
  children,
  variant,
  size,
  enableIcon = true,
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
        "not-last:border-r-0 group h-full flex-1 rounded-none first:rounded-l-full last:rounded-r-full",
        variant === "secondary" && "bg-foreground",
        className,
      )}
      {...props}
    >
      {enableIcon && (
        <IconCheck className="hidden group-data-[state=on]:inline" />
      )}
      {children}
    </ToggleGroupPrimitive.Item>
  );
};
