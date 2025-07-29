import { cva, type VariantProps } from "cva-extended";
import type { FC } from "react";

import "../lib/flags/flags.css";

import { cn } from "@workspace/ui/lib/utils";

export const flagVariants = cva({
  variants: {
    size: {
      s: "h-3 w-4",
      m: "h-[15px] w-[20px]",
      l: "h-[24px] w-[32px]",
    },
  },
  defaultVariants: {
    size: "s",
  },
});

export interface FlagProps extends VariantProps<typeof flagVariants> {
  code: string;
  className?: string;
}

export const Flag: FC<FlagProps> = ({ code, size, className }) => {
  const updatedCode = getCountryCode(code.toUpperCase());

  return (
    <div
      title={updatedCode}
      className={cn(
        flagVariants({ size }),
        `fflag fflag-${updatedCode.toUpperCase()}`,
        className,
      )}
    />
  );
};

function getCountryCode(code: string) {
  switch (code) {
    case "EN":
    case "EN-GB":
      return "GB";
    case "MF":
      return "FR";
    case "SJ":
      return "NO";
    case "SW":
      return "KE";
    default:
      return code;
  }
}
