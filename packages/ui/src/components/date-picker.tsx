"use client";

import { IconCalendarMonth } from "@tabler/icons-react";
import { useFormatter } from "next-intl";
import { useEffect, useState, type FC } from "react";

import { Calendar } from "@workspace/ui/components/calendar";
import { inputVariants } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { assertNever, cn, type VariantProps } from "@workspace/ui/lib/utils";

export interface DatePickerProps extends VariantProps<typeof inputVariants> {
  id?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: Date | string;
  format?: "ISO" | "YYYY-MM-DD";
  invalid?: boolean;
  disabled?: boolean;
  onValueChange?: (value: Date | undefined) => void;
}

export const DatePicker: FC<DatePickerProps> = ({
  size,
  placeholder,
  defaultValue,
  format = "ISO",
  invalid,
  disabled,
  onValueChange,
  ...props
}) => {
  const formatter = useFormatter();
  const [date, setDate] = useState<Date | undefined>(
    defaultValue ? new Date(defaultValue) : undefined,
  );

  useEffect(() => {
    if (onValueChange) {
      onValueChange(date);
    }
  }, [date, onValueChange]);

  return (
    <Popover>
      <input
        type="hidden"
        aria-invalid={invalid}
        value={date ? formatDate(date, format) : ""}
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
          {...props}
        >
          {date ? (
            formatter.dateTime(date)
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <IconCalendarMonth className="my-1 h-full text-neutral-800" />
        </button>
      </PopoverTrigger>

      <PopoverContent closeButton="sm" withArrow={false}>
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

function formatDate(date: Date, format: "ISO" | "YYYY-MM-DD") {
  switch (format) {
    case "ISO": {
      return date.toISOString();
    }
    case "YYYY-MM-DD": {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    default:
      assertNever(format);
  }
}
