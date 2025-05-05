import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Header } from "@workspace/ui/components/header";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import { Logo } from "@workspace/ui/components/tvet/logo";

import { AppHeaderApplyButton } from "@/components/app-header-apply-button";
import { ProfileMenu } from "@/components/profile-menu";

export const AppHeader: FC = () => {
  const t = useTranslations();

  return (
    <Header
      isFloating
      startDecorator={
        <Link href="/" title="home" aria-label="home">
          <Logo className="h-full" />
        </Link>
      }
      endDecorator={
        <>
          <AppHeaderApplyButton>{t("Common.apply")}</AppHeaderApplyButton>
          <SidebarTrigger>{t("Menu.menu")}</SidebarTrigger>
          <ProfileMenu />
        </>
      }
    />
  );
};
