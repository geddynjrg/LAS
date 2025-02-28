import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "cva-extended";
import type { FC, PropsWithChildren } from "react";

export const roundedCornerSectionVariants = cva({
  base: "[&>*:nth-last-child(2)]:pb-5 [&>*]:last:relative [&>*]:last:-mt-5",
  variants: {
    layout: {
      fluid:
        "lg:flex lg:[&>*:nth-last-child(2)]:rounded-none lg:[&>*:nth-last-child(2)]:pb-0 lg:[&>*]:last:mt-0 lg:[&>*]:last:lg:flex-1",
      stacked: "",
    },
  },
  defaultVariants: {
    layout: "fluid",
  },
});

export interface RoundCornerSectionProps
  extends PropsWithChildren,
    VariantProps<typeof roundedCornerSectionVariants> {
  className?: string;
}

export const RoundedCornerSection: FC<RoundCornerSectionProps> = ({
  children,
  className,
  layout,
}) => {
  return (
    <div className={roundedCornerSectionVariants({ layout, className })}>
      {children}
    </div>
  );
};

export const roundedCornerSectionHeaderVariants = cva({
  base: "lg:flex-2 relative flex overflow-clip pb-5 md:w-full",
  variants: {
    variant: {
      default: "",
      rounded: "rounded-tr-2xl",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface RoundCornerSectionHeaderProps
  extends PropsWithChildren,
    VariantProps<typeof roundedCornerSectionHeaderVariants> {
  asChild?: boolean;
  className?: string;
}

export const RoundedCornerSectionHeader: FC<RoundCornerSectionHeaderProps> = ({
  asChild,
  className,
  children,
  variant,
}) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={roundedCornerSectionHeaderVariants({ variant, className })}
    >
      {children}
    </Comp>
  );
};
