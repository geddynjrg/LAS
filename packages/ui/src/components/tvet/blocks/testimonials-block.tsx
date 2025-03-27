import { useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { Testimonial } from "@workspace/ui/components/testimonial";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { cn } from "@workspace/ui/lib/utils";

export interface TestimonialsBlockProps {
  className?: string;
  block_type: "testimonials";
  testimonials: {
    block_type: "testimonial";
    name: string;
    image?: {
      title: string;
      type: string;
      id: string;
      uuid: string;
      name: string;
      url: string;
      bundle: string;
      mime_type: string;
      size: number;
      alt: string;
      width: string;
      height: string;
    }[];
    short_description: {
      value: string | null;
      format: string | null;
      processed: string | null;
    };
  }[];
}

export const TestimonialsBlock: FC<TestimonialsBlockProps> = ({
  testimonials,
  className,
}) => {
  const t = useTranslations("TestimonialsBlock");

  return (
    <section className={cn("bg-neutral-100 py-10", className)}>
      <div className="app-container gap-4 px-4">
        <Heading type="h3">{t("testimonials")}</Heading>
        <Carousel className="mt-6">
          <CarouselContent>
            {testimonials.map((testimonial, key) => (
              <CarouselItem key={`testimonial-${key}`}>
                <Testimonial
                  title={testimonial.name}
                  imageUrl={testimonial.image?.at(0)?.url ?? ""}
                  imageAlt={testimonial.image?.at(0)?.alt ?? ""}
                >
                  <DescriptionBlock {...testimonial.short_description} />
                </Testimonial>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselControls className="mt-6" />
        </Carousel>
      </div>
    </section>
  );
};
