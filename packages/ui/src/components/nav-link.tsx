"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, FC } from "react";

export const NavLink: FC<ComponentProps<typeof Link>> = ({
  href,
  ...props
}) => {
  const pathname = usePathname();
  const url = typeof href === "string" ? href : (href.pathname ?? "");

  const isActive =
    pathname.endsWith(url) || (url.includes(pathname) && pathname !== "/");

  return <Link href={href} {...props} data-active={isActive} />;
};
