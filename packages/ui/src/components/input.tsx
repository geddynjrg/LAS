import { cva, type VariantProps } from "cva-extended";
import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const inputVariants = cva({
  base: "bg-background border-border file:text-foreground placeholder:text-muted-foreground focus-visible-ring w-full border px-2 file:border-0 file:bg-transparent file:text-sm file:font-medium active:border-green-300 disabled:cursor-not-allowed disabled:opacity-50",
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
  type?: "text" | "password" | "email" | "number" | "tel" | "file";
  defaultValue?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  startDecorator?: ReactNode;
  endDecorator?: ReactNode;
  className?: string;
}

export const Input: FC<InputProps> = ({
  type = "text",
  className,
  invalid,
  size,
  startDecorator,
  endDecorator,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative [&_svg]:size-5 [&_svg]:text-neutral-800",

        className,
      )}
    >
      {startDecorator && (
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2">
          {startDecorator}
        </div>
      )}
      <input
        type={type}
        className={cn(
          inputVariants({ size }),
          invalid && "border-destructive",
          // "h-full w-full border-none bg-transparent px-2 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none",
          startDecorator && "ps-8",
          endDecorator && "pe-8",
        )}
        aria-invalid={invalid}
        {...props}
      />
      {endDecorator && (
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2">
          {endDecorator}
        </div>
      )}
    </div>
  );
};
