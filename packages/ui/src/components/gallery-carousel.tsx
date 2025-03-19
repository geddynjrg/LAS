import Image from "next/image";
import { type FC, type ReactNode } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import {
  GalleryModal,
  GalleryModalTrigger,
} from "@workspace/ui/components/gallery-modal";
import { cn } from "@workspace/ui/lib/utils";

export interface ImagesInfoProps {
  url: string;
  alt: string;
}

export interface LightboxModalProps {
  children?: ReactNode;
  className?: string;
  images: Array<ImagesInfoProps>;
}

export const GalleryCarousel: FC<LightboxModalProps> = ({
  images,
  className,
}) => {
  return (
    <GalleryModal title="Gallery" images={images}>
      <Carousel className={cn(className)}>
        <CarouselContent className="aspect-video lg:h-full">
          {images.map((image, index) => (
            <CarouselItem
              key={index}
              className="relative box-border hover:cursor-pointer"
            >
              <GalleryModalTrigger index={index} asChild>
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              </GalleryModalTrigger>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselControls
          position="onContent"
          variant="white"
          className="mb-2"
        />
      </Carousel>
    </GalleryModal>
  );
};
