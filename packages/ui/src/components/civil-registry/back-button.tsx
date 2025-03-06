import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import type { FC } from "react";

import { Button, type ButtonProps } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export const BackButton: FC<Pick<ButtonProps, "variant">> = ({
  variant = "secondary",
}) => (
  <Button asChild variant={variant}>
    <Link href="/" className={cn("w-full max-w-[23rem]")}>
      <IconArrowLeft /> Back to dashboard
    </Link>
  </Button>
);
