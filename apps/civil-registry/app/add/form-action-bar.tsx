import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import type { FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";

export interface FormActionBarProps {
  cancelUrl?: string;
  prevUrl?: string;
  prevLabel?: string;
  cancelLabel?: string;
  nextLabel?: string;
  nextUrl?: string;
  hasBtnIcons?: boolean;
  submitType?: "disabled" | "hidden" | "active";
}

export const FormActionBar: FC<FormActionBarProps> = ({
  cancelUrl,
  prevUrl,
  submitType,
  prevLabel = "Back",
  cancelLabel = "Cancel",
  nextLabel = "Next",
  nextUrl = null,
  hasBtnIcons = true,
}) => {
  return (
    <ActionBar className="mt-8">
      <Container className="flex flex-row items-center justify-between gap-4 max-md:[&>*]:flex-1">
        {cancelUrl && (
          <Button variant="secondary" asChild>
            <Link href={cancelUrl}>
              {hasBtnIcons && <IconArrowLeft />}
              {cancelLabel}
            </Link>
          </Button>
        )}

        {prevUrl && (
          <Button variant="secondary" asChild>
            <Link href={prevUrl}>
              {hasBtnIcons && <IconArrowLeft />}
              {prevLabel}
            </Link>
          </Button>
        )}

        {submitType !== "hidden" && (
          <Button type="submit" disabled={submitType === "disabled"}>
            {nextLabel}
            {hasBtnIcons && <IconArrowRight />}
          </Button>
        )}
        {nextUrl !== null && (
          <Button variant="default" asChild>
            <Link href={nextUrl}>
              {nextLabel}
              {hasBtnIcons && <IconArrowRight />}
            </Link>
          </Button>
        )}
      </Container>
    </ActionBar>
  );
};
