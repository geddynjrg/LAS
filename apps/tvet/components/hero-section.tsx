import Image from "next/image";
import type { FC, ReactNode } from "react";

import { Heading } from "@/components/heading";

export interface HeroSectionProps {
  title: ReactNode;
  backgroundUrl: string;
  backgroundAlt: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export const HeroSection: FC<HeroSectionProps> = ({
  title,
  backgroundUrl,
  backgroundAlt,
  actions,
  children,
}) => {
  return (
    <section>
      <div className="mx relative aspect-[4/5] sm:aspect-[16/9] md:max-h-96 md:w-full">
        <Image
          fill
          priority
          className="object-cover"
          src={backgroundUrl}
          alt={backgroundAlt}
        />
      </div>

      <div className="bg-primary text-primary-foreground relative -mt-4 rounded-tr-xl px-4 pb-4 text-lg">
        <Heading className="-mb-13 -translate-y-13">{title}</Heading>
        <div className="mt-4">{children}</div>
      </div>

      {actions && (
        <div className="bg-theme-100 flex justify-center gap-4 p-4 [&>*]:max-w-80 [&>*]:flex-1">
          {actions}
        </div>
      )}
    </section>
  );
};
