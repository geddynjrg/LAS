import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "cva-extended";
import {
  Children,
  type CSSProperties,
  type FC,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@workspace/ui/lib/utils";

export const buttonVariants = cva({
  base: "focus-visible-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-transparent text-center text-sm font-bold transition-colors disabled:pointer-events-none disabled:text-neutral-400 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  variants: {
    variant: {
      default:
        "text-primary-foreground bg-primary hover:bg-primary-hover active:bg-primary-active focus-visible:bg-primary-hover data-[state=on]:bg-primary-active disabled:bg-neutral-200",
      secondary:
        "border-secondary text-foreground hover:bg-secondary/20 active:bg-secondary focus-visible:bg-secondary/20 focus-visible:border-secondary/20 data-[state=on]:bg-secondary [.uwezo_&]:data-[state=on]:text-primary-foreground border-solid disabled:border-neutral-400",
      danger:
        "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active data-[state=on]:bg-destructive-active focus-visible:bg-destructive-hover disabled:bg-neutral-200",
      neutral:
        "hover:text-neutral-600 focus-visible:text-neutral-900 active:text-neutral-900 data-[state=on]:text-neutral-900",
      ghost:
        "hover:bg-accent hover:text-accent-foreground active:bg-accent-active",
      link: "text-primary underline-offset-4 hover:underline",
      shadow:
        "text-primary hover:bg-accent hover:text-accent-foreground active:bg-accent-active shadow-[var(--box-shadow-elevation-02)]",
    },
    size: {
      xs: "min-h-6 px-1 py-0 text-xs [&_svg]:size-4",
      sm: "min-h-7 px-4 text-sm [&_svg]:size-4",
      md: "min-h-8 px-4 text-sm [&_svg]:size-6",
      default: "min-h-10 px-[20px] py-1 text-base",
      lg: "min-h-12 px-8 py-2 text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  ref?: RefObject<HTMLButtonElement>;
  asChild?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  name?: string;
  value?: string;
  role?: string;
  active?: boolean;
  disabled?: boolean;
  tabIndex?: number;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
  variant?:
    | "default"
    | "secondary"
    | "danger"
    | "neutral"
    | "ghost"
    | "link"
    | "shadow";
  size?: "xs" | "sm" | "md" | "default" | "lg";
}

export const Button: FC<ButtonProps> = ({
  style,
  className,
  variant,
  size,
  asChild = false,
  children,
  active,
  ...props
}) => {
  const Comp = asChild ? Slot : "button";
  const hasOneChildOnly =
    children && Children.count(children) === 1 && !asChild;

  return (
    <Comp
      style={style}
      data-state={active ? "on" : undefined}
      className={cn(
        buttonVariants({ variant, size, className }),
        hasOneChildOnly && "has-[>svg]:aspect-square has-[>svg]:p-0",
      )}
      {...props}
    >
      {children}
    </Comp>
  );
};
