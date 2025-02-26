import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  image?: {
    url?: string;
    alt?: string;
  };
}

export const SectionHeader: FC<SectionHeaderProps> = ({
  children,
  title,
  className,
  image,
}) => {
  return (
    <section className={cn("bg-background mt-4", className)}>
      <div className="relative flex aspect-[10/9] overflow-clip rounded-tr-xl bg-blend-darken md:max-h-96 md:w-full">
        {image?.url && (
          <img
            src={image.url}
            alt={image.alt}
            className="min-h-full min-w-full object-cover"
          />
        )}
        <h2
          className={cn(
            "typo-h1 overflow-hidden leading-tight",
            "text-primary-foreground app-container absolute bottom-8 left-1/2 z-10 m-4 max-w-6xl -translate-x-1/2",
          )}
        >
          <span className="after:ml-4 after:mr-[-100%] after:inline-block after:h-[0.5em] after:w-full after:border-t-2 after:align-bottom after:content-['']">
            {title}
          </span>
        </h2>
      </div>

      <div className="bg-theme-100 relative -mt-4 rounded-tr-2xl px-6 py-7">
        <div className="app-container max-w-6xl">{children}</div>
      </div>
    </section>
  );
};
