import Image from "next/image";
import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";

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
    <section className="bg-theme-100">
      <div className="relative aspect-[4/5] sm:aspect-[16/9] md:max-h-96 md:w-full xl:max-h-[600px]">
        <Image
          fill
          priority
          style={{
            objectFit: "cover",
          }}
          src={backgroundUrl}
          alt={backgroundAlt}
        />
      </div>
      <RoundedCornerCard className="bg-primary text-primary-foreground relative -mt-4 p-0 px-4 pb-4 pt-0 md:pb-7">
        <Container className="max-w-6xl">
          <Heading className="-mb-13 -translate-y-13 md:-mb-16 md:-translate-y-16">
            {title}
          </Heading>
          <div className="mt-4">{children}</div>
        </Container>
      </RoundedCornerCard>

      {actions && (
        <div className="bg-theme-100 flex justify-center gap-4 p-4 [&>*]:max-w-80 [&>*]:flex-1">
          {actions}
        </div>
      )}
    </section>
  );
};
