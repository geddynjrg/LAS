import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import {
  RoundedCornerSection,
  RoundedCornerSectionHeader,
} from "@workspace/ui/components/tvet/rounded-corner-section";
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
    <RoundedCornerSection className={className}>
      <RoundedCornerSectionHeader variant="rounded" className="!pb-0">
        {image?.url && (
          <img
            src={image.url}
            alt={image.alt}
            className="min-h-full min-w-full object-cover max-lg:aspect-video"
          />
        )}
        <div id="overlay" className="bg-theme-500/40 z-1 absolute inset-0" />
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
