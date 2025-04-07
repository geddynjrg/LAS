import { useFormatter } from "next-intl";

import { cn } from "@workspace/ui/lib/utils";

interface CurrencyProps extends Intl.NumberFormatOptions {
  amount: number;
  currency: "KES";
  className?: string;
}

export function Currency({ amount, className, ...props }: CurrencyProps) {
  const format = useFormatter();

  const formatted = format.number(amount, {
    style: "currency",
    ...props,
  });

  return (
    <span className={cn("whitespace-nowrap", className)}>{formatted}</span>
  );
}
