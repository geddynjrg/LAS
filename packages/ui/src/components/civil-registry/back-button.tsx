import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Button, type ButtonProps } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export const BackButton: FC<
  Pick<ButtonProps, "variant"> & { url?: string }
> = ({ variant = "secondary", url = "/" }) => {
  const t = useTranslations("Buttons");
  return (
    <Button asChild variant={variant}>
      <Link href={url} className={cn("w-full max-w-[23rem]")}>
        <IconArrowLeft /> {t("backToDashboard")}
      </Link>
    </Button>
  );
};
