import Image from "next/image";
import type { FC, ReactNode } from "react";

import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import {
  RoundedCornerSection,
  RoundedCornerSectionHeader,
} from "@workspace/ui/components/tvet/rounded-corner-section";

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
    <RoundedCornerSection className={className}>
      <RoundedCornerSectionHeader
        variant="rounded"
        className="aspect-video !pb-0"
      >
        {image?.url && (
          <Image
            fill
            sizes="(max-size: 1024px) 100vw, 50vw"
            src={image.url}
            alt={image.alt ?? "section-header"}
            className="object-cover object-center"
          />
        )}
        <div id="overlay" className="z-1 absolute inset-0 bg-[#253628]/40" />
        <div className="z-2 absolute bottom-4 m-4 overflow-hidden">
          <h2 className="typo-h1 text-primary-foreground leading-tight after:ml-4 after:mr-[-100%] after:inline-block after:h-[0.5em] after:w-full after:border-t-2 after:align-bottom after:content-['']">
            {title}
          </h2>
        </div>
      </RoundedCornerSectionHeader>

      <RoundedCornerCard className="z-3">{children}</RoundedCornerCard>
    </RoundedCornerSection>
  );
};
export interface SectionHeaderTopProps {
  className?: string;
  children?: ReactNode;
}

export const SectionHeaderTop: FC<SectionHeaderTopProps> = ({ children }) => {
  return (
    <div className="lg:flex-2 relative flex overflow-clip max-lg:rounded-tr-xl md:w-full">
      {children}
    </div>
  );
};

export const SectionHeaderBottom: FC<SectionHeaderTopProps> = ({
  children,
}) => {
  return (
    <div className="bg-theme-100 relative z-10 -mt-4 rounded-tr-2xl px-6 py-7 lg:mt-0 lg:flex-1">
      {children}
    </div>
  );
};
