import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "cva-extended";
import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";

const badgeVariants = cva({
  base: "ring-neutral-1000 outline-neutral-1000 aria-invalid:focus-visible:ring-0 text-md inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-0.5 font-semibold transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-4 [&>svg]:pointer-events-none [&>svg]:size-3",
  variants: {
    variant: {
      default:
        "bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-transparent shadow-sm",
      secondary:
        "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border-transparent",
      destructive:
        "bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90 border-transparent shadow-sm",
      outline:
        "text-neutral-1000 [a&]:hover:bg-accent [a&]:hover:text-accent-foreground outline-1",
    },
    radius: {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "m",
    radius: "sm",
  },
});

function Badge({
  className,
  variant,
  radius,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, radius }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
