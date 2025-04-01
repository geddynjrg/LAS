"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FC, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";

const DISABLED_ROUTES = ["/apply", "/dashboard"];

export interface AppHeaderApplyButtonProps {
  children?: ReactNode;
}

export const AppHeaderApplyButton: FC<AppHeaderApplyButtonProps> = ({
  children,
}) => {
  const pathname = usePathname();
  const [isHidden, setIsHidden] = useState(isRouteDisabled(pathname));

  // update visibility state when the pathname changes
  useEffect(() => {
    setIsHidden(isRouteDisabled(pathname));
  }, [pathname]);

  if (isHidden) {
    return null;
  }

  return (
    <Button asChild>
      <Link href="/apply">{children}</Link>
    </Button>
  );
};

function isRouteDisabled(pathname: string) {
  return DISABLED_ROUTES.some((route) => pathname.startsWith(route));
}
