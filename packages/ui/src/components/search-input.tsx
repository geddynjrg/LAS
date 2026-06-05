"use client";

import * as Popover from "@radix-ui/react-popover";
import { IconLoader, IconSearch } from "@tabler/icons-react";
import { Command as CommandPrimitive } from "cmdk";
import { useEffect, useState, type FC } from "react";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Input, type InputProps } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";

export type Option = Record<"value" | "label", string>;

export interface SearchInputProps extends InputProps {
  options?: Option[] | readonly Option[];
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
  onValueSelect?: (value: string) => void;
  isLoading?: boolean;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  clearOnSelect?: boolean;
}

export const SearchInput: FC<SearchInputProps> = ({
  id,
  name,
  options = [],
  placeholder,
  defaultValue,
  disabled,
  isLoading = false,
  onValueChange,
  clearOnSelect = false,
  onValueSelect,
  ...props
}: SearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(defaultValue ?? "");
  const [lastValidValue, setLastValidValue] = useState(defaultValue ?? "");

  // Sync external defaultValue without notifying parent (avoids render loops).
  useEffect(() => {
    const next = defaultValue ?? "";
    setSearch((current) => (current === next ? current : next));
    setLastValidValue((current) => (current === next ? current : next));
  }, [defaultValue]);

  const updateSearch = (value: string, notifyParent = true) => {
    setSearch(value);
    if (notifyParent) {
      onValueChange?.(value || undefined);
    }
  };

  const handleBlur = () => {
    setIsOpen(false);

    const isValidSelection = options.some(
      (option) => option.label === search || option.value === search,
    );

    if (search && !isValidSelection) {
      const restored = lastValidValue || "";
      setSearch(restored);
      onValueChange?.(restored || undefined);
    } else if (isValidSelection && search !== lastValidValue) {
      setLastValidValue(search);
    }
  };

  const listboxId = `${id || "search"}-listbox`;

  return (
    <div className="w-full min-w-0">
      {name ? <input type="hidden" name={name} value={search} /> : null}
      <Popover.Root open={isOpen}>
        <Command loop>
          <Popover.Trigger asChild>
            <CommandPrimitive.Input
              asChild
              onClick={() => setIsOpen(true)}
              onFocus={() => setIsOpen(true)}
              onBlur={handleBlur}
              id={id}
              value={search}
              placeholder={placeholder}
              disabled={disabled}
              onValueChange={updateSearch}
            >
              <Input
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                endDecorator={isLoading ? <IconLoader /> : <IconSearch />}
                {...props}
              />
            </CommandPrimitive.Input>
          </Popover.Trigger>
          {!isOpen && <CommandList aria-hidden="true" className="hidden" />}
          <Popover.Content
            asChild
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="w-(--radix-popover-trigger-width) z-20 mt-1 rounded-md border shadow-md"
          >
            <CommandList id={listboxId} role="listbox">
              {isLoading ? (
                <CommandPrimitive.Loading className="p-1">
                  <Skeleton className="w-full p-2">...</Skeleton>
                </CommandPrimitive.Loading>
              ) : null}
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onMouseDown={(e) => e.preventDefault()}
                    onSelect={(currentValue) => {
                      const selectedOption = options.find(
                        (option) => option.label === currentValue,
                      );
                      const newValue = clearOnSelect
                        ? ""
                        : (selectedOption?.label ?? "");

                      setSearch(newValue);
                      setLastValidValue(newValue);
                      onValueChange?.(newValue || undefined);
                      onValueSelect?.(selectedOption?.value ?? "");
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Popover.Content>
        </Command>
      </Popover.Root>
    </div>
  );
};
