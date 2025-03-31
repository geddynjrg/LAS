"use client";

import { IconUserCircle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

import { useSession } from "@/hooks/useSession";
import { logout } from "@/lib/api/logout";

export const ProfileMenu: FC = () => {
  const t = useTranslations("Common");
  const { session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="size-13 hover:bg-header flex flex-col items-center gap-0 rounded-none px-2"
        >
          <IconUserCircle />

          <span className="text-nowrap text-xs font-normal">
            {t("myProfile")}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="text-foreground">
            {t("myApplications")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogoutButton>{t("signOut")}</LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function LogoutButton({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setSession } = useSession();

  return (
    <form
      action={() =>
        logout().finally(() => {
          setSession(null);
          router.refresh();
        })
      }
    >
      <button type="submit">{children}</button>
    </form>
  );
}
