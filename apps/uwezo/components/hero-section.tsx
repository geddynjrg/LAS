import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";

export interface HeroSectionProps {
  title: ReactNode;
  backgroundAlt: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export const HeroSection: FC<HeroSectionProps> = ({
  title,
  backgroundAlt,
  actions,
  children,
}) => {
  return (
    <section
      className="bg-[url(/hero-banners/banner-mobile.jpg)] bg-cover bg-top bg-no-repeat md:bg-[url(/hero-banners/banner.jpg)]"
      aria-label={backgroundAlt}
    >
      <Container className="text-background pb-12.5 items-center gap-12 pt-36 lg:flex">
        <div className="basis-2/3">
          <h1 className="border-background mb-7 border-b-2 pb-7">{title}</h1>
          <div className="mb-10.5 mt-4">{children}</div>
        </div>

        {actions && (
          <div className="flex basis-1/3 justify-center [&>*]:flex-1">
            {actions}
          </div>
        )}
      </Container>
    </section>
  );
};
