import { IconArrowLeft, IconArrowRight, IconDots } from "@tabler/icons-react";
import { type FC, type ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface PaginationProps {
  pages?: unknown[];
  className?: string;
  activePage?: number;
  disabled?: boolean;
}

// placeholder for non-rendered pages
const ELLIPSIS = "...";
// number of elements in pagination, ellipsis included
const MAX_VISIBLE_ELEMENTS = 7;

export const Pagination: FC<PaginationProps> = ({
  pages,
  className,
  activePage = 1,
  disabled,
}) => {
  const totalPages = pages?.length ?? 0;

  const paginatedPages = getPageRange(
    totalPages,
    activePage,
    MAX_VISIBLE_ELEMENTS,
  );

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <ul className="flex flex-row items-center gap-1">
        <NavArrow href="#" disabled={activePage === 1} />

        {paginatedPages.map((page, i) =>
          page === ELLIPSIS ? (
            <Ellipsis key={`dots-${i}`} />
          ) : (
            <PaginationItem
              key={page}
              href="#"
              isActive={activePage === page}
              disabled={disabled}
            >
              {page}
            </PaginationItem>
          ),
        )}

        <NavArrow href="#" dir="right" disabled={activePage === totalPages} />
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

const PaginationItem: FC<PaginationItemProps> = ({
  isActive,
  disabled,
  href,
  children,
}) => (
  <li>
    <a
      href={href}
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
    </a>
  </li>
);

interface NavArrowProps {
  href?: string;
  disabled?: boolean;
  dir?: "left" | "right";
}

const NavArrow: FC<NavArrowProps> = ({ href, disabled, dir = "left" }) => {
  const ariaLabel = dir === "left" ? "Go to previous page" : "Go to next page";

  const iconClassNames = cn("text-neutral-700", disabled && "text-neutral-400");

  return (
    <li className={cn(dir === "left" ? "mr-3" : "ml-3")}>
      <a
        href={href}
        aria-label={ariaLabel}
        className={cn(disabled && "pointer-events-none cursor-default")}
      >
        {dir === "left" ? (
          <IconArrowLeft className={iconClassNames} />
        ) : (
          <IconArrowRight className={iconClassNames} />
        )}
      </a>
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
