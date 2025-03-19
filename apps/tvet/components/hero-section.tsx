import Image from "next/image";
import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";

import { Heading } from "@/components/heading";

export interface HeroSectionProps {
  title: ReactNode;
  backgroundUrl?: string;
  backgroundAlt?: string;
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
      <div className="relative aspect-[4/5] max-h-[500px] w-full sm:aspect-[16/9]">
        {backgroundUrl && backgroundAlt && (
          <Image
            fill
            priority
            className="object-cover"
            src={backgroundUrl}
            alt={backgroundAlt}
          />
        )}
        <div className="h-29 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-black/0" />
      </div>

      <Container className="px-0">
        <RoundedCornerCard className="bg-primary text-primary-foreground xl:-mt-30 relative -mt-4 px-4 pb-4 max-xl:pt-0 md:pb-7">
          <Container>
            <Heading className="-mb-13 -translate-y-13 md:-mb-16 md:-translate-y-16 xl:mb-0 xl:translate-y-0">
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
      </Container>
    </section>
  );
};
