"use client";

import { IconHome, IconReload } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { type FC, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";

export interface ErrorPageProps {
  title?: ReactNode;
  children?: ReactNode;
  reset?: () => void;
}

export const ErrorPage: FC<ErrorPageProps> = ({ title, children, reset }) => {
  const t = useTranslations("ErrorBoundary");

  function handleReload() {
    if (reset) {
      return reset();
    }

    window.location.reload();
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="space-y-3 text-center">
        <h2 className="typo-h2">{title ?? t("title")}</h2>
        <div className="typo-body mt-8">{children ?? t("description")}</div>

        <div className="mt-8 flex flex-col items-center justify-center">
          <Button variant="ghost" asChild className="text-foreground">
            <Link href="/">
              <IconHome className="size-4" />
              {t("home")}
            </Link>
          </Button>
          <Button type="button" variant="ghost" onClick={handleReload}>
            <IconReload className="size-4" />
            {t("reload")}
          </Button>
        </div>
      </div>
    </div>
  );
};
