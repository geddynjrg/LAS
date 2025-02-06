import Image from "next/image";
import type { FC, ReactNode } from "react";

import { Heading } from "@/components/heading";

export interface HeroSectionProps {
  title: ReactNode;
  backgroundUrl: string;
  backgroundAlt: string;
  children?: ReactNode;
}

export const HeroSection: FC<HeroSectionProps> = ({
  title,
  backgroundUrl,
  backgroundAlt,
  children,
}) => {
  return (
    <div>
      <div className="relative aspect-[2/3] sm:aspect-[16/9] md:max-h-96 md:w-full">
        <Image fill src={backgroundUrl} alt={backgroundAlt} objectFit="cover" />
      </div>

      <div className="bg-primary text-primary-foreground relative -mt-4 rounded-tr-xl px-4 pb-4 text-lg">
        <Heading className="-mb-11 -translate-y-11">{title}</Heading>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
