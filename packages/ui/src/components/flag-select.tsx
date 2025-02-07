"use client";

import { useTransition } from "react";

import { Flag } from "@workspace/ui/components/flag";
import { Select, type SelectProps } from "@workspace/ui/components/select";

export interface FlagSelectProps<T extends string>
  extends Omit<SelectProps<T>, "disabled"> {
  onChange: (value: T) => Promise<void> | void;
}

export const FlagSelect = <T extends string>({
  options,
  onChange,
  ...props
}: FlagSelectProps<T>) => {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: T) {
    const locale = value as T;
    startTransition(() => {
      onChange(locale);
    });
  }

  const optionsWithFlags = options?.map((item) => ({
    ...item,
    label: (
      <span className="flex items-center gap-2">
        <Flag code={item.value} />

        {item.label}
      </span>
    ),
  }));

  return (
    <Select
      onValueChange={handleChange}
      options={optionsWithFlags}
      disabled={isPending}
      {...props}
    />
  );
};
