import * as SelectPrimitive from "@radix-ui/react-select";
import { IconCaretDown, IconCheck, IconLoader } from "@tabler/icons-react";
import { cva, type VariantProps } from "cva-extended";
import { useMemo, type ComponentProps, type FC, type ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const selectVariants = cva({
  base: "bg-background border-border [&:user-invalid]:border-destructive placeholder:text-muted-foreground focus-visible-ring flex w-full items-center justify-between border px-2 leading-snug focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",

  variants: {
    size: {
      sm: "h-7 rounded-md text-sm",
      default: "h-10 rounded-md text-base",
      lg: "h-12 rounded-md text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface SelectOption<T extends string> {
  label: ReactNode;
  value: T;
  disabled?: boolean;
}

export interface SelectProps<T extends string>
  extends VariantProps<typeof selectVariants> {
  placeholder?: ReactNode;
  className?: string;
  options?: SelectOption<T>[] | readonly SelectOption<T>[];
  name?: string;
  value?: T;
  defaultValue?: T;
  selectedLabel?: ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onValueChange?: (value: T) => void;
}

export const Select = <T extends string>({
  options,
  placeholder,
  size,
  invalid,
  loading,
  selectedLabel,
  className,
  ...props
}: SelectProps<T>) => {
  const cachedOptions = useMemo(
    () =>
      options?.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </SelectItem>
      )),
    [options],
  );

  return (
    <SelectPrimitive.Root data-invalid={invalid} {...props}>
      <SelectTrigger
        size={size}
        loading={loading}
        className={cn(invalid && "border-destructive", className)}
      >
        {selectedLabel ? (
          <SelectPrimitive.Value
            placeholder={placeholder}
            aria-label={selectedLabel.toString()}
          >
            {selectedLabel}
          </SelectPrimitive.Value>
        ) : (
          <SelectPrimitive.Value placeholder={placeholder} />
        )}
      </SelectTrigger>

      <SelectContent>{cachedOptions}</SelectContent>
    </SelectPrimitive.Root>
  );
};

const SelectTrigger: FC<
  { loading?: boolean; className?: string; children: ReactNode } & VariantProps<
    typeof selectVariants
  >
> = ({ size, loading, className, children }) => (
  <SelectPrimitive.Trigger
    className={cn(selectVariants({ size }), className)}
    tabIndex={0}
  >
    {children}

    <SelectPrimitive.Icon asChild>
      {loading ? <IconLoader /> : <Caret dir="down" />}
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

const SelectScrollUpButton: FC = () => (
  <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
    <Caret dir="up" />
  </SelectPrimitive.ScrollUpButton>
);

const SelectScrollDownButton: FC = () => (
  <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
    <Caret dir="down" />
  </SelectPrimitive.ScrollDownButton>
);

const SelectContent: FC<ComponentProps<typeof SelectPrimitive.Content>> = ({
  className,
  children,
  position = "popper",
  ...props
}) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />

      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-(--radix-select-trigger-height) min-w-(--radix-select-trigger-width) w-full",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

const SelectItem: FC<ComponentProps<typeof SelectPrimitive.Item>> = ({
  className,
  children,
  ...props
}) => (
  <SelectPrimitive.Item
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>

    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <IconCheck className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
);

const Caret: FC<{ dir: "up" | "down" }> = ({ dir }) => (
  <IconCaretDown
    className={cn(
      "size-5 fill-neutral-600 text-neutral-600",
      dir === "up" && "rotate-180",
    )}
  />
);
