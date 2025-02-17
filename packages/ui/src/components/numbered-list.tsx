import { Children, type FC, type ReactNode } from "react";

import { BulletBox } from "@workspace/ui/components/bullet-box";
import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const numberedListVariants = cva({
  base: "flex list-none flex-col gap-2",
  variants: {
    variant: {
      numbers: "",
      bulletNumbers: "gap-4",
    },
  },
  defaultVariants: {
    variant: "numbers",
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
}) => {
  const arrayChildren = Children.toArray(children);
  return (
    <ol className={cn(numberedListVariants({ variant, className }))}>
      {arrayChildren.map((child, index) => {
        return (
          <li key={index} className="flex w-full items-center gap-1">
            {variant === "numbers" && <Number>{index + 1}</Number>}
            {variant === "bulletNumbers" && <Bullet>{index + 1}</Bullet>}
            {child}
          </li>
        );
      })}
    </ol>
  );
};

export interface NumberedListItemProps {
  children?: ReactNode;
  icon?: ReactNode;
  key?: string;
}

export const NumberedListItem: FC<NumberedListItemProps> = ({
  key,
  children,
  icon,
}) => {
  return (
    <div key={key} className="flex w-full items-center justify-between">
      {children}
      {icon && (
        <span className="text-primary ml-2 flex-none [&>svg]:size-10">
          {icon}
        </span>
      )}
    </div>
  );
};

const Number: FC<{ children?: ReactNode }> = ({ children }) => (
  <span className="typo-display text-primary w-[2ch] text-center">
    {children}
  </span>
);

const Bullet: FC<{ children?: ReactNode }> = ({ children }) => (
  <BulletBox className="typo-h5 text-primary-foreground mr-5">
    {children}
  </BulletBox>
);
