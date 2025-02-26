import { useFormatter } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface NewsItemProps {
  imageUrl: string;
  date: Date;
  title: string;
  linkTitle: string;
  href: string;
}

export const NewsItem: FC<NewsItemProps> = ({
  imageUrl,
  date,
  title,
  linkTitle,
  href,
}) => {
  const format = useFormatter();

  return (
    <div className={cn("flex w-full flex-col items-center gap-6")}>
      <img
        className="h-auto w-full"
        src={imageUrl}
        alt={title}
        width={370}
        height={305}
      />
      <div className={cn("flex flex-col items-center gap-2.5")}>
        <div className="typo-body-small-bold flex flex-row gap-1">
          <Link
            href={href}
            className="text-primary hover:text-link visited:text-primary uppercase hover:underline"
          >
            {linkTitle}
          </Link>
          {/* separator line */}
          <p>-</p>
          <p>
            {format.dateTime(date, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <a
          className="text-primary typo-h6 hover:text-link text-center"
          href="#"
        >
          {title}
        </a>
      </div>
    </div>
  );
};
