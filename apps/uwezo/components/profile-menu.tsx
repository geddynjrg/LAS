"use client";

import { IconUserCircle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

import { useSession } from "@/hooks/useSession";
import { getCurrentUserRolesClient } from "@/lib/auth/guards.client";

export const ProfileMenu: FC = () => {
  const t = useTranslations("Common");
  const { session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    getCurrentUserRolesClient().then((roles) => {
      setIsAdmin(
        roles.some(
          (role) =>
            role.toLowerCase() === "admin" ||
            role.toLowerCase() === "administrator",
        ),
      );
    });
  }, []);

  if (!session) {
    return null;
  }

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
        <DropdownMenuItem asChild>
          <Link href="/logout">{t("signOut")}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
