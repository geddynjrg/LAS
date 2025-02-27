"use client";

import { IconCalendarMonth } from "@tabler/icons-react";
import { useFormatter } from "next-intl";
import { useState, type FC } from "react";

import { Calendar } from "@workspace/ui/components/calendar";
import { inputVariants } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn, type VariantProps } from "@workspace/ui/lib/utils";

export interface DatePickerProps extends VariantProps<typeof inputVariants> {
  id?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: Date | string;
  invalid?: boolean;
  disabled?: boolean;
}

export const DatePicker: FC<DatePickerProps> = ({
  size,
  placeholder,
  defaultValue,
  invalid,
  disabled,
  ...props
}) => {
  const format = useFormatter();
  const [date, setDate] = useState<Date | undefined>(
    defaultValue ? new Date(defaultValue) : undefined,
  );

  return (
    <Popover>
      <input
        type="hidden"
        aria-invalid={invalid}
        value={date?.toISOString() ?? ""}
        {...props}
      />
      <PopoverTrigger asChild>
        <button
          className={cn(
            inputVariants({ size }),
            "flex w-full cursor-pointer items-center justify-between",
            invalid && "border-destructive",
          )}
          disabled={disabled}
        >
          {date ? (
            format.dateTime(date)
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}

          <IconCalendarMonth className="my-1 h-full text-neutral-800" />
        </button>
      </PopoverTrigger>

      <PopoverContent withCloseButton={false} withArrow={false}>
        <Calendar
          value={date}
          onValueChange={setDate}
          autoFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
};
