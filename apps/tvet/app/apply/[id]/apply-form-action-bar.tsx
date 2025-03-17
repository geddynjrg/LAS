import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import type { FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";

export interface ApplyFormActionBarProps {
  cancelUrl?: string;
  prevUrl?: string;
  nextUrl?: string;
}

export const ApplyFormActionBar: FC<ApplyFormActionBarProps> = ({
  cancelUrl,
  nextUrl,
  prevUrl,
}) => {
  return (
    <ActionBar className="mt-8">
      <Container className="flex flex-row items-center justify-between gap-4 max-md:[&>*]:flex-1">
        {cancelUrl && (
          <Button variant="secondary" asChild>
            <Link href={cancelUrl}>
              <IconArrowLeft />
              Cancel
            </Link>
          </Button>
        )}

        {prevUrl && (
          <Button variant="secondary" asChild>
            <Link href={prevUrl}>
              <IconArrowLeft />
              Back
            </Link>
          </Button>
        )}

        {nextUrl && (
          <Button asChild>
            <Link href={nextUrl}>
              Next
              <IconArrowRight />
            </Link>
          </Button>
        )}
      </Container>
    </ActionBar>
  );
};
