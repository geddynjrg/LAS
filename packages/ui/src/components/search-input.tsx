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
  const [search, setSearch] = useState(defaultValue);

  // call onValueChange when search value changes
  useEffect(() => {
    onValueChange?.(search);
  }, [onValueChange, search]);

  return (
    <Popover.Root open={isOpen}>
      <Command loop>
        <Popover.Trigger asChild>
          <CommandPrimitive.Input
            asChild
            onClick={() => setIsOpen(true)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            id={id}
            value={search}
            placeholder={placeholder}
            disabled={disabled}
            onValueChange={setSearch}
          >
            <Input
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
          <CommandList>
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
                    setSearch(
                      options.find(
                        (option) =>
                          option.label === currentValue && !clearOnSelect,
                      )?.label ?? "",
                    );
                    onValueSelect?.(
                      options.find((option) => option.label === currentValue)
                        ?.value ?? "",
                    );
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
  );
};
