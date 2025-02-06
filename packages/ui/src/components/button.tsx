import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "cva-extended";
import {
	Children,
	type FC,
	type MouseEvent,
	type ReactNode,
	type RefObject,
} from "react";

import { cn } from "@workspace/ui/lib/utils";

export const buttonVariants = cva({
	base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-bold cursor-pointer disabled:text-neutral-400",
	variants: {
		variant: {
			default:
				"text-primary-foreground bg-primary hover:bg-primary-hover active:bg-primary-active focus-visible:bg-primary-hover disabled:bg-neutral-200 data-[state=on]:bg-primary-active",
			secondary:
				"border border-secondary text-foreground hover:bg-secondary/20 active:bg-secondary focus-visible:bg-secondary/20 focus-visible:border-secondary/20 disabled:border-neutral-400 data-[state=on]:bg-secondary",
			danger: "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active data-[state=on]:bg-destructive-active focus-visible:bg-destructive-hover disabled:bg-neutral-200",
			neutral:
				"hover:text-neutral-600 active:text-neutral-900 focus-visible:text-neutral-900 data-[state=on]:text-neutral-900",
			ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent-active",
			link: "text-primary underline-offset-4 hover:underline",
		},
		size: {
			sm: "h-7 text-sm px-4",
			default: "h-10 px-7 py-2",
			lg: "h-12 text-lg px-8",
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
	active?: boolean;
	disabled?: boolean;
	className?: string;
	children?: ReactNode;
}

export const Button: FC<ButtonProps> = ({
	className,
	variant,
	size,
	asChild = false,
	ref,
	children,
	active,
	...props
}) => {
	const Comp = asChild ? Slot : "button";
	const hasOneChildOnly = children && Children.count(children) === 1;

	return (
		<Comp
			data-state={active ? "on" : undefined}
			className={cn(
				buttonVariants({ variant, size, className }),
				hasOneChildOnly && "has-[>svg]:aspect-square has-[>svg]:p-0",
			)}
			ref={ref}
			{...props}
		>
			{children}
		</Comp>
	);
};
