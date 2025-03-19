import { Slot } from "@radix-ui/react-slot";
import type { CSSProperties, FC, ReactNode } from "react";

import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const containerVariant = cva({
  base: "max-w-(--app-container-max-width) px-(--app-container-side-padding) mx-auto w-full",
});

export interface ContainerProps extends VariantProps<typeof containerVariant> {
  id?: string;
  asChild?: boolean;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

export const Container: FC<ContainerProps> = ({
  asChild,
  style,
  className,
  ...props
}) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      style={style}
      className={cn(containerVariant(), className)}
      {...props}
    />
  );
};
