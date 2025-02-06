import Image from "next/image";
import type { FC, ReactNode } from "react";

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

      <div className="bg-primary text-primary-foreground relative rounded-tr-xl px-4 pb-4 text-lg [&_strong]:font-bold">
        <h1 className="leading-13 -my-13 -translate-y-12 overflow-hidden text-[2.75rem]">
          <span className="after:ml-4 after:mr-[-100%] after:inline-block after:h-[0.5em] after:w-full after:border-t-2 after:border-inherit after:align-bottom after:content-['']">
            {title}
          </span>
        </h1>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
