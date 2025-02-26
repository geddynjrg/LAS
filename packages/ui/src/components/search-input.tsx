import * as Popover from "@radix-ui/react-popover";
import { IconSearch } from "@tabler/icons-react";
import { Command as CommandPrimitive } from "cmdk";
import { useState, type FC } from "react";

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
  onValueChange?: (value: string) => void;
  isLoading?: boolean;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const SearchInput: FC<SearchInputProps> = ({
  id,
  options = [],
  placeholder,
  defaultValue,
  disabled,
  isLoading = false,
  onValueChange,
  ...props
}: SearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(defaultValue);

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
            onValueChange={(value) => {
              setSearch(value);
              onValueChange?.(value);
            }}
          >
            <Input endDecorator={<IconSearch />} {...props} />
          </CommandPrimitive.Input>
        </Popover.Trigger>
        {!isOpen && <CommandList aria-hidden="true" className="hidden" />}
        <Popover.Content
          asChild
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-(--radix-popover-trigger-width)"
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
                      options.find((option) => option.label === currentValue)
                        ?.label ?? "",
                    );
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
