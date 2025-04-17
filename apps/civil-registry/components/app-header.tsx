import { IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Logo } from "@workspace/ui/components/civil-registry/logo";
import { Header } from "@workspace/ui/components/header";
import { IconAccessibility } from "@workspace/ui/components/icon/icon-accessibility";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

import { LocaleSelect } from "@/components/locale-select";
import { type Locale } from "@/i18n/config";

export interface AppHeaderProps {
  locale: Locale;
}

export const AppHeader: FC<AppHeaderProps> = ({ locale }) => {
  return (
    <Header
      startDecorator={
        <Link href="/" className="mt-2 block">
          <Logo className="size-11" />
        </Link>
      }
      endDecorator={
        <div className="flex flex-row gap-4">
          <Button variant="ghost" size="md">
            <IconSearch size={24} />
          </Button>
          <LocaleSelect defaultValue={locale} />
          <Button variant="ghost" size="md">
            <IconAccessibility height={24} width={24} />
          </Button>
          <SidebarTrigger className="mr-4 w-4" />
        </div>
      }
    />
  );
};
