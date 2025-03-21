import { useTranslations } from "next-intl";
import type { FC, ReactNode } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { Testimonial } from "@workspace/ui/components/testimonial";

import { Heading } from "@/components/heading";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { TestimonialsBlockType } from "@/lib/api/schema/block/testimonials-block.schema";

export interface TestimonialsBlockProps extends TestimonialsBlockType {}

export const TestimonialsBlock: FC<TestimonialsBlockProps> = ({
  testimonials,
}) => {
  const t = useTranslations("TestimonialsBlock");

  return (
    <section className="bg-neutral-100 py-10">
      <div className="app-container gap-4 px-4">
        <Heading type="h3">{t("testimonials")}</Heading>
        <Carousel className="mt-6">
          <CarouselContent>
            {testimonials.map((testimonial, key) => (
              <CarouselItem key={`testimonial-${key}`}>
                <Testimonial
                  title={testimonial.name}
                  imageUrl={testimonial.image.at(0)?.url ?? ""}
                  imageAlt={testimonial.image.at(0)?.alt ?? ""}
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
