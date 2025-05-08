"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  IconCaretDown,
  IconCheck,
  IconLoader,
  IconSearch,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FC, type ReactNode } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { inputVariants } from "@workspace/ui/components/input";
import { cn, type VariantProps } from "@workspace/ui/lib/utils";

import { usePrevious } from "../hooks/usePrevious";

export type Option = Record<"value" | "label", string>;

export interface ComboboxProps extends VariantProps<typeof inputVariants> {
  options?: Option[] | readonly Option[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  loading?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
}

export const Combobox: FC<ComboboxProps> = ({
  options,
  defaultValue,
  onValueChange,
  placeholder,
  name,
  ...props
}) => {
  const t = useTranslations("Combobox");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const prevOptions = usePrevious(options);

  // reset value when options change
  useEffect(() => {
    if (prevOptions?.length && options?.length !== prevOptions?.length) {
      setValue("");
    }
  }, [options?.length, prevOptions?.length]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Trigger {...props}>
        {value ? (
          options?.find((option) => option.value === value)?.label
        ) : (
          <span className="text-neutral-600">
            {placeholder ?? t("placeholder")}
          </span>
        )}
      </Trigger>

      <input type="hidden" name={name} value={value} />

      <Popover.Content className="w-(--radix-popover-trigger-width) z-50 mt-1 rounded-md border shadow-md">
        <Command>
          <CommandInput placeholder={t("searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            <CommandGroup>
              {options?.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    const newValue = currentValue === value ? "" : currentValue;
                    setValue(newValue);
                    setOpen(false);
                    onValueChange?.(newValue);
                  }}
                >
                  <IconCheck
                    className={cn(
                      "mr-2 size-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </Popover.Content>
    </Popover.Root>
  );
};

const Trigger: FC<
  Pick<ComboboxProps, "size" | "loading" | "invalid" | "id"> & {
    children?: ReactNode;
  }
> = ({ size, loading, invalid, children, ...props }) => {
  return (
    <Popover.Trigger asChild>
      <button
        tabIndex={0}
        className={cn(
          inputVariants({ size }),
          "flex w-full cursor-pointer items-center justify-between gap-2",
          invalid && "border-destructive",
        )}
        {...props}
      >
        <IconSearch className="size-5 text-neutral-600" />
        <div className="flex-1 text-left">{children}</div>
        {loading ? <IconLoader /> : <Caret dir="down" />}
      </button>
    </Popover.Trigger>
  );
};

const Caret: FC<{ dir: "up" | "down" }> = ({ dir }) => (
  <IconCaretDown
    className={cn(
      "size-5 fill-neutral-600 text-neutral-600",
      dir === "up" && "rotate-180",
    )}
  />
);
