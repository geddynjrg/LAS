"use client";

import { IconArrowLeft, IconArrowRight, IconDots } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type FC, type ReactElement, type ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface PaginationProps {
  children?:
    | ReactElement<PaginationItemProps>
    | ReactElement<PaginationItemProps>[];
  pageCount: number;
  navigationId?: string;
  className?: string;
  disabled?: boolean;
  createPageURL?: (pageNumber: number) => string;
}

// placeholder for non-rendered pages
const ELLIPSIS = "...";
// number of elements in pagination, ellipsis included
const MAX_VISIBLE_ELEMENTS = 7;

export const Pagination: FC<PaginationProps> = ({
  className,
  pageCount,
  disabled,
  createPageURL,
  navigationId,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? 1);

  // // retain exiting search parameters
  const pageUrl =
    createPageURL ??
    ((pageNumber: number | string) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", pageNumber.toString());

      return `${pathname}?${params.toString()}${navigationId ? `#${navigationId}` : ""}`;
    });

  const paginatedPages = getPageRange(
    pageCount,
    currentPage ?? 1,
    MAX_VISIBLE_ELEMENTS,
  );

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <ul className="flex flex-row items-center">
        <NavArrow
          href={pageUrl((currentPage ?? 1) - 1)}
          disabled={currentPage === 1}
        />
        {paginatedPages.map((page, i) =>
          page === ELLIPSIS ? (
            <Ellipsis key={`dots-${i}`} />
          ) : (
            <PaginationItem
              key={page}
              href={typeof page === "number" ? pageUrl(page) : "#"}
              isActive={currentPage === page}
              disabled={disabled}
            >
              {page}
            </PaginationItem>
          ),
        )}

        <NavArrow
          href={pageUrl((currentPage ?? 1) + 1)}
          dir="right"
          disabled={currentPage === pageCount || pageCount === 0}
        />
      </ul>
    </nav>
  );
};

interface PaginationItemProps {
  isActive?: boolean;
  disabled?: boolean;
  href?: string;
  children?: ReactNode;
}

export const PaginationItem: FC<PaginationItemProps> = ({
  isActive,
  disabled,
  href,
  children,
}) => (
  <li>
    <Link
      href={href ?? "#"}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "active:text-neutral-1000 inline-flex h-8 w-8 select-none items-center justify-center rounded-sm font-bold text-neutral-700 hover:text-neutral-600 focus:border-2 focus:border-blue-400",
        isActive &&
          "bg-primary text-stepper-active-foreground hover:text-stepper",
        disabled && "pointer-events-none bg-transparent text-neutral-400",
        isActive && disabled && "bg-neutral-400 text-neutral-200",
      )}
    >
      {children}
    </Link>
  </li>
);

interface NavArrowProps {
  href: string;
  disabled?: boolean;
  dir?: "left" | "right";
}

const NavArrow: FC<NavArrowProps> = ({ href, disabled, dir = "left" }) => {
  const ariaLabel = dir === "left" ? "Go to previous page" : "Go to next page";

  const iconClassNames = cn("text-neutral-700", disabled && "text-neutral-400");

  return (
    <li className={cn(dir === "left" ? "mr-3" : "ml-3")}>
      <Link
        href={href}
        aria-label={ariaLabel}
        className={cn(disabled && "pointer-events-none cursor-default")}
      >
        {dir === "left" ? (
          <IconArrowLeft className={iconClassNames} />
        ) : (
          <IconArrowRight className={iconClassNames} />
        )}
      </Link>
    </li>
  );
};

const Ellipsis: FC = () => {
  return (
    <li>
      <span
        aria-hidden
        className="inline-flex h-8 w-8 items-end justify-center text-neutral-700"
      >
        <IconDots className="h-4 w-4" />
      </span>
    </li>
  );
};

// handle rendering of pagination elements
function getPageRange(
  pagesLength: number,
  activePage: number,
  elementCount: number,
) {
  // return all the pages if there's only a few
  if (pagesLength <= elementCount) {
    return Array.from({ length: pagesLength }, (_, i) => i + 1);
  }

  const range = [];

  // always show the first page
  range.push(1);

  if (activePage <= 4) {
    // If active page is near the start, show first few pages then ellipsis
    range.push(2, 3, 4, 5, ELLIPSIS);
  } else if (activePage >= pagesLength - 3) {
    // If active page is near the end, show last few pages
    range.push(
      ELLIPSIS,
      pagesLength - 4,
      pagesLength - 3,
      pagesLength - 2,
      pagesLength - 1,
    );
  } else {
    // Active page is in the middle, show surrounding pages with ellipses
    range.push(ELLIPSIS, activePage - 1, activePage, activePage + 1, ELLIPSIS);
  }
  // always show last page
  range.push(pagesLength);

  return range;
}
