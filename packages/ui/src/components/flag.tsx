import { cva, type VariantProps } from "cva-extended";
import type { FC } from "react";
import FlagPrimitive from "react-flagpack";

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
  const updatedCode = getCountryCode(code);

  return (
    <FlagPrimitive
      code={updatedCode}
      className={cn(flagVariants({ size }), className)}
      hasBorder={false}
      size={size}
    />
  );
};

function getCountryCode(code: string) {
  switch (code) {
    case "en":
      return "GB-UKM";
    case "sw":
      return "KE";
    default:
      return code;
  }
}
