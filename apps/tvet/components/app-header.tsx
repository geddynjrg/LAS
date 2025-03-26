"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Header } from "@workspace/ui/components/header";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

import { Logo } from "@/components/logo";
import { useSession } from "@/hooks/useSession";

export interface AppHeaderProps {}

export const AppHeader: FC<AppHeaderProps> = () => {
  const t = useTranslations("Common");
  const { session } = useSession();

  return (
    <Header
      isFloating
      startDecorator={
        <Link href="/">
          <Logo className="h-full" />
        </Link>
      }
      endDecorator={
        <>
          <Button asChild>
            <Link href="/apply">{t("apply")}</Link>
          </Button>
          {session && (
            <Button asChild variant="secondary">
              <Link href="/dashboard">Dashh!!</Link>
            </Button>
          )}
          <SidebarTrigger>{t("menu")}</SidebarTrigger>
        </>
      }
    />
  );
};
