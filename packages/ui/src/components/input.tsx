"use client";

import { cva, type VariantProps } from "cva-extended";
import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const inputVariants = cva({
  base: "bg-background border-border [&:user-invalid]:border-destructive file:text-foreground placeholder:text-muted-foreground focus-visible-ring relative w-full border px-2 file:border-0 file:bg-transparent file:text-sm file:font-medium active:border-green-300 disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    size: {
      sm: "h-7 rounded-md py-1 text-sm",
      default: "h-10 rounded-md py-2 text-base",
      lg: "h-12 rounded-md py-2 text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface InputProps extends VariantProps<typeof inputVariants> {
  id?: string;
  name?: string;
  type?: "text" | "password" | "email" | "number" | "tel" | "date" | "file";
  defaultValue?: string;
  value?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: string;
  max?: string;
  autoComplete?: string;
  disabled?: boolean;
  invalid?: boolean;
  readonly?: boolean;
  placeholder?: string;
  startDecorator?: ReactNode;
  endDecorator?: ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  ref?: React.Ref<HTMLInputElement>;
  // ARIA attributes for accessibility
  role?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-describedby'?: string;
  'aria-required'?: boolean | 'true' | 'false';
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}

export const Input: FC<InputProps> = ({
  type = "text",
  className,
  invalid,
  size,
  startDecorator,
  endDecorator,
  readonly,
  onValueChange,
  onChange,
  ...props
}) => {
  return (
    <div className={cn("relative", className)}>
      {startDecorator && <Decorator>{startDecorator}</Decorator>}

      <input
        type={type}
        readOnly={readonly}
        onKeyDown={(e) => {
          if (type === "tel") {
            // Allow navigation, editing, and clipboard operations
            if ([
              'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
              'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
              'Home', 'End'
            ].includes(e.key)) {
              return;
            }

            // Allow clipboard operations (Ctrl/Cmd + keys)
            if (e.ctrlKey || e.metaKey) {
              return;
            }

            // Allow text selection (Shift + keys)
            if (e.shiftKey) {
              return;
            }

            // Only block non-numeric characters for actual typing
            if (!/[0-9]/.test(e.key)) {
              e.preventDefault();
            }
          }
        }}
        className={cn(
          inputVariants({ size }),
          invalid && "border-destructive",
          startDecorator &&
            (typeof startDecorator === "string" ? "ps-11" : "ps-8"),
          endDecorator && (typeof endDecorator === "string" ? "pe-11" : "pe-8"),
        )}
        onChange={(e) => {
          // Strip whitespace from tel input
          if (type === "tel") {
            const normalized = e.target.value.replace(/\s+/g, "");
            e.target.value = normalized;
          }
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        aria-invalid={invalid}
        {...props}
      />

      {endDecorator && <Decorator>{endDecorator}</Decorator>}
    </div>
  );
};

const Decorator: FC<{ children?: ReactNode }> = ({ children }) => {
  const isText = typeof children === "string";

  return (
    <div
      className={cn(
        "absolute inset-y-0 z-10 flex w-8 items-center justify-center overflow-hidden text-ellipsis text-sm text-neutral-600 first:start-0 last:end-0 [&_svg]:size-5",
        isText && "w-10 first:border-r last:border-l",
      )}
    >
      {children}
    </div>
  );
};
