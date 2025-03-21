import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import type { FC } from "react";

import { Header } from "@workspace/ui/components/header";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

import { ProfileMenu } from "@/components/profile-menu";

export const AppHeader: FC = () => {
  const t = useTranslations("Common");

  return (
    <Header
      startDecorator={
        <Link href="/">
          <Image alt="Logo" src="/logo.jpeg" width={69} height={58} />
        </Link>
      }
      className="bg-background"
      endDecorator={
        <>
          <SidebarTrigger>{t("menu")}</SidebarTrigger>
          <ProfileMenu />
        </>
      }
    />
  );
};
