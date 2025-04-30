import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export interface FormActionBarProps {
  cancelUrl?: string;
  prevUrl?: string;
  prevLabel?: string;
  cancelLabel?: string;
  nextLabel?: string;
  nextUrl?: string;
  hasBtnIcons?: boolean;
  isPending?: boolean;
  submitType?: "disabled" | "hidden" | "active";
}

export const FormActionBar: FC<FormActionBarProps> = ({
  cancelUrl,
  prevUrl,
  submitType,
  prevLabel,
  cancelLabel,
  nextLabel,
  nextUrl = null,
  hasBtnIcons = true,
  isPending,
}) => {
  const t = useTranslations("Common");

  return (
    <ActionBar className="mt-8">
      <div
        className={cn(
          "flex w-full flex-row items-center justify-between gap-2 max-md:[&>*]:flex-1",
          !cancelUrl && !prevUrl && "justify-end",
        )}
      >
        {cancelUrl && (
          <Button variant="secondary" asChild disabled={isPending}>
            <Link href={cancelUrl}>
              {hasBtnIcons && <IconArrowLeft />}
              {cancelLabel ?? t("cancel")}
            </Link>
          </Button>
        )}

        {prevUrl && (
          <Button variant="secondary" asChild disabled={isPending}>
            <Link href={prevUrl}>
              {hasBtnIcons && <IconArrowLeft />}
              {prevLabel ?? t("back")}
            </Link>
          </Button>
        )}

        {submitType !== "hidden" && (
          <Button
            type="submit"
            disabled={submitType === "disabled" || isPending}
          >
            {nextLabel ?? t("next")}
            {hasBtnIcons && <IconArrowRight />}
          </Button>
        )}
        {nextUrl !== null && (
          <Button
            variant="default"
            asChild
            disabled={isPending}
            className="whitespace-nowrap"
          >
            <Link href={nextUrl}>
              {nextLabel ?? t("next")}
              {hasBtnIcons && <IconArrowRight />}
            </Link>
          </Button>
        )}
      </div>
    </ActionBar>
  );
};
