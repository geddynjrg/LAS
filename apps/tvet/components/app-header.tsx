import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Header } from "@workspace/ui/components/header";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

import { AppHeaderApplyButton } from "@/components/app-header-apply-button";
import { Logo } from "@/components/logo";
import { ProfileMenu } from "@/components/profile-menu";

export const AppHeader: FC = () => {
  const t = useTranslations("Common");

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
          <AppHeaderApplyButton>{t("apply")}</AppHeaderApplyButton>
          <SidebarTrigger>{t("menu")}</SidebarTrigger>
          <ProfileMenu />
        </>
      }
    />
  );
};
