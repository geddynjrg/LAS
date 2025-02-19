import Image from "next/image";
import type { FC, ReactNode } from "react";

import { Heading } from "@/components/heading";
import { RoundedCard } from "@/components/rounded-card";

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
      <div className="relative aspect-[4/5] sm:aspect-[16/9] md:max-h-96 md:w-full xl:max-h-[600px]">
        <Image
          fill
          priority
          className="object-cover"
          src={backgroundUrl}
          alt={backgroundAlt}
        />
      </div>

      <RoundedCard variant="primary" className="relative -mt-4 px-0 pb-4 pt-0">
        <div className="app-container">
          <Heading className="-mb-13 -translate-y-13">{title}</Heading>
          <div className="app- mt-4">{children}</div>
        </div>
      </RoundedCard>

      {actions && (
        <div className="bg-theme-100 flex justify-center gap-4 p-4 [&>*]:max-w-80 [&>*]:flex-1">
          {actions}
        </div>
      )}
    </section>
  );
};
