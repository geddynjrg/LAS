import type { Meta, StoryObj } from "@storybook/react";

import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import { Testimonial } from "@workspace/ui/components/testimonial";

const meta = {
  component: Carousel,
  args: {
    children: (
      <CarouselContent>
        <CarouselItem>1</CarouselItem>
        <CarouselItem>2</CarouselItem>
        <CarouselItem>3</CarouselItem>
        <CarouselItem>4</CarouselItem>
        <CarouselItem>5</CarouselItem>
        <CarouselItem>6</CarouselItem>
      </CarouselContent>
    ),
  },
} satisfies Meta<typeof Carousel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: ({ children }) => (
    <Carousel>
      {children}
      <CarouselControls />
    </Carousel>
  ),
} satisfies Story;

export const WithoutDots = {
  render: ({ children }) => (
    <Carousel>
      {children}
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
} satisfies Story;

export const MaxDots = {
  render: ({ children }) => (
    <Carousel>
      {children}
      <CarouselControls visibleDots={3} />
    </Carousel>
  ),
} satisfies Story;

export const WhiteControlsDots = {
  render: ({ children }) => (
    <div className="bg-neutral-500 p-4">
      <Carousel>
        {children}
        <CarouselControls visibleDots={3} variant="white" />
      </Carousel>
    </div>
  ),
} satisfies Story;

export const NextItemVisible = {
  render: () => (
    <Carousel>
      <CarouselContent>
        {Array.from({ length: 6 }).map((_, i) => (
          <CarouselItem key={i} className="mx-2 h-36 basis-[80%] bg-amber-200">
            {i + 1}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselControls />
    </Carousel>
  ),
} satisfies Story;

export const ControlsOnContent = {
  render: () => (
    <Carousel>
      <CarouselContent>
        <CarouselItem>
          <Testimonial
            imageUrl="https://placehold.jp/150x150.png"
            title="First LastName"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Testimonial>
        </CarouselItem>
        <CarouselItem>
          <Testimonial
            imageUrl="https://placehold.jp/150x150.png"
            title="First LastName"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Testimonial>
        </CarouselItem>
        <CarouselItem>
          <Testimonial
            imageUrl="https://placehold.jp/150x150.png"
            title="First LastName"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Testimonial>
        </CarouselItem>
        <CarouselItem>
          <Testimonial
            imageUrl="https://placehold.jp/150x150.png"
            title="First LastName"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Testimonial>
        </CarouselItem>
      </CarouselContent>
      <CarouselControls position="onContent" />
    </Carousel>
  ),
} satisfies Story;
