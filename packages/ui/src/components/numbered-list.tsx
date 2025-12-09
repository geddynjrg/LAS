import { Children, type FC, type ReactNode } from "react";

import { BulletBox } from "@workspace/ui/components/bullet-box";
import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const numberedListVariants = cva({
  variants: {
    variant: {
      numbers: "",
      bulletNumbers: "gap-4",
    },
    bulletAlignment: {
      top: "",
      middle: "",
    },
  },
  defaultVariants: {
    variant: "numbers",
    bulletAlignment: "middle",
  },
});

export interface NumberedListProps
  extends VariantProps<typeof numberedListVariants> {
  className?: string;
  children?: ReactNode;
}

export const NumberedList: FC<NumberedListProps> = ({
  className,
  children,
  variant,
  bulletAlignment,
}) => {
  const arrayChildren = Children.toArray(children);
  return (
    <ol
      className={cn(
        numberedListVariants({ variant, bulletAlignment, className }),
        "flex list-none flex-col",
      )}
    >
      {arrayChildren.map((child, index) => {
        return (
          <li
            key={index}
            className={cn(
              "flex w-full gap-x-1",
              bulletAlignment === "top" ? "items-start" : "items-center",
            )}
          >
            {(!variant || variant === "numbers") && (
              <Number>{index + 1}</Number>
            )}
            {variant === "bulletNumbers" && <Bullet>{index + 1}</Bullet>}
            {child}
          </li>
        );
      })}
    </ol>
  );
};

export interface NumberedListItemProps {
  className?: string;
  children?: ReactNode;
  icon?: ReactNode;
}

export const NumberedListItem: FC<NumberedListItemProps> = ({
  children,
  className,
  icon,
}) => {
  return (
    <div className={cn("flex w-full items-center justify-between", className)}>
      <div>{children}</div>
      {icon && (
        <span className="text-primary ml-2 flex-none [&>svg]:size-10">
          {icon}
        </span>
      )}
    </div>
  );
};

const Number: FC<{ children?: ReactNode }> = ({ children }) => (
  <span className="typo-display text-primary -ml-2 w-[2ch] text-center">
    {children}
  </span>
);

const Bullet: FC<{ children?: ReactNode }> = ({ children }) => (
  <BulletBox className="typo-h5 text-primary-foreground mr-5">
    {children}
  </BulletBox>
);
