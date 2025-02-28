"use client";

import Autoplay from "embla-carousel-autoplay";
import type { FC, ReactNode } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselControls,
} from "@workspace/ui/components/carousel";

export interface SocialMediaCarouselProps {
  className?: string;
  children?: ReactNode;
}

export const SocialMediaCarousel: FC<SocialMediaCarouselProps> = ({
  className,
  children,
}) => {
  return (
    <Carousel plugins={[Autoplay({ delay: 5000 })]} className={className}>
      <CarouselContent>{children}</CarouselContent>
      <CarouselControls />
    </Carousel>
  );
};
