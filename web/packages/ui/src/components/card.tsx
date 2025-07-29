import Link from "next/link";
import type { FC, ReactNode } from "react";

import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const cardVariants = cva({
  base: cn(
    "flex flex-col gap-4",
    "bg-background rounded-lg border border-solid px-4 py-6",
  ),
  variants: {
    variant: {
      success: "border-neutral-300",
      warning: "border-yellow-400",
      danger: "border-yellow-400",
    },
  },
});

export interface CardProps extends VariantProps<typeof cardVariants> {
  className?: string;
  title?: ReactNode;
  caption?: ReactNode;
  statusLabel?: string;
  footer?: ReactNode;
  children?: ReactNode;
  variant: "success" | "warning" | "danger";
}

export const Card: FC<CardProps> = ({
  className,
  title,
  caption,
  statusLabel,
  footer,
  children,
  variant,
}) => {
  return (
    <div className={cn(cardVariants({ variant }), className)}>
      <div className={cn("flex flex-col gap-2", "text-center")}>
        {title && <div className="typo-h5">{title}</div>}
        {caption}
        {statusLabel && (
          <ValidationNote variant={variant} label={statusLabel} />
        )}
      </div>

      {children}

      <div className={cn("flex flex-col items-stretch gap-3")}>{footer}</div>
    </div>
  );
};

const validationStatus = cva({
  variants: {
    variant: {
      success: "bg-green-400",
      warning: "bg-yellow-400",
      danger: "bg-red-400",
    },
  },
});

interface ValidationNoteProps extends VariantProps<typeof validationStatus> {
  label?: string;
}

const ValidationNote: FC<ValidationNoteProps> = ({ variant, label }) => (
  <div className="flex items-center justify-center gap-[0.375rem]">
    <div
      className={cn(
        "h-[0.625rem] w-[0.625rem]",
        "rounded-full",
        validationStatus({ variant }),
      )}
    />
    <div>{label}</div>
  </div>
);

export const PersonCardLink: FC<{ children: ReactNode }> = ({ children }) => (
  <Link
    href={"#"}
    className={cn(
      "typo-link",
      "flex items-center gap-1",
      "border-b border-solid border-blue-400",
    )}
  >
    {children}
  </Link>
);

export const PersonCardFooterWrap: FC<{ children: ReactNode }> = ({
  children,
}) => <div className={cn("flex flex-col items-center gap-3")}>{children}</div>;
