import type { FC } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface TextareaProps {
  id?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const Textarea: FC<TextareaProps> = ({ className, ...props }) => {
  return (
    <textarea
      className={cn(
        "border-border placeholder:text-muted-foreground focus-visible-ring bg-background [&:user-invalid]:border-destructive flex min-h-[136px] w-full rounded-md border px-3 py-2 text-base disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
};
