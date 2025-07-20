"use client";

import { IconUserCircle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

import { useSession } from "@/hooks/useSession";

export const ProfileMenu: FC = () => {
  const t = useTranslations("Common");
  const { isAuthenticated, profile, logout, isLoading } = useSession();

  const isAdmin = useMemo(() => {
    if (!profile?.roles) return false;

    return profile.roles.some(
      (role) =>
        role.toLowerCase() === "admin" ||
        role.toLowerCase() === "administrator",
    );
  }, [profile?.roles]);

  if (!isAuthenticated || isLoading) {
    return null;
  }

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="" asChild>
        <Button
          variant="ghost"
          className="size-13 rounded-0 hover:bg-header flex flex-col items-center gap-0 p-0"
        >
          <IconUserCircle />

          <span className="text-nowrap text-xs font-normal">
            {t("myProfile")}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {profile?.name && (
          <>
            <div className="px-2 py-1.5 text-sm font-medium">
              {profile.name}
            </div>
            <div className="text-muted-foreground px-2 pb-1.5 text-xs">
              {profile.email}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="text-foreground">
            {t("myApplications")}
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard" className="text-foreground">
                {t("adminDashboard")}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
