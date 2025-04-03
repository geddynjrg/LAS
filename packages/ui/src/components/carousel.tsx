"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cva, type VariantProps } from "cva-extended";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FC,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  autoPlay?: number;
  plugins?: CarouselPlugin;
  setApi?: (api: CarouselApi) => void;
  className?: string;
  children: ReactNode;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selectedItem: number;
} & CarouselProps;

const CarouselContext = createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

export const Carousel: FC<CarouselProps> = ({
  opts,
  setApi,
  plugins,
  autoPlay,
  className,
  children,
  ...props
}) => {
  const emblaPlugins = plugins || [];
  if (autoPlay) {
    emblaPlugins.push(Autoplay({ delay: autoPlay }));
  }
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: "x",
    },
    emblaPlugins,
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedItem, setSelectedItem] = useState<number>(0);

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) {
      return;
    }

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
    setSelectedItem(api.selectedScrollSnap());
  }, []);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  useEffect(() => {
    if (!api || !setApi) {
      return;
    }

    setApi(api);
  }, [api, setApi]);

  useEffect(() => {
    if (!api) {
      return;
    }

    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        selectedItem,
        children,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
};

interface CarouselContentProps {
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}

export const CarouselContent: FC<CarouselContentProps> = ({
  className,
  ...props
}) => {
  const { carouselRef } = useCarousel();

  return (
    <div ref={carouselRef} className={cn("h-full w-full overflow-hidden")}>
      <div className={cn("flex", className)} {...props} />
    </div>
  );
};

export const CarouselItem: FC<{
  className?: string;
  children: ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn(
        "flex w-full min-w-0 shrink-0 grow-0 basis-full justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const carouselControlVariants = cva({
  base: "flex flex-row justify-center gap-3",
  variants: {
    position: {
      onContent: "absolute bottom-4 w-full",
      bottom: "mt-2",
    },
    variant: {
      default: "border-foreground",
      white: "border-background",
      uwezo: "border-neutral-500",
    },
  },
  defaultVariants: {
    variant: "default",
    position: "bottom",
  },
});

export interface CarouselControlsProps
  extends VariantProps<typeof carouselControlVariants> {
  className?: string;
  visibleDots?: number;
  hideControls?: boolean;
}

export const CarouselControls: FC<CarouselControlsProps> = ({
  className,
  visibleDots,
  position,
  hideControls = false,
  variant,
}) => {
  return (
    <div className={cn(carouselControlVariants({ position }), className)}>
      {!hideControls && <CarouselPrevious variant={variant} />}
      <CarouselDots visibleDots={visibleDots} variant={variant} />
      {!hideControls && <CarouselNext variant={variant} />}
    </div>
  );
};

export const carouselArrowsVariants = cva({
  variants: {
    variant: {
      default: "text-foreground",
      white: "text-primary-foreground",
      uwezo: "text-neutral-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CarouselControlsProps
  extends VariantProps<typeof carouselArrowsVariants> {
  className?: string;
}

export const CarouselPrevious: FC<CarouselControlsProps> = ({
  variant,
  ...props
}) => {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <IconChevronLeft
        stroke={2}
        className={carouselArrowsVariants({ variant })}
      />
    </Button>
  );
};

export const CarouselNext: FC<CarouselControlsProps> = ({
  variant,
  ...props
}) => {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <IconChevronRight
        stroke={2}
        className={carouselArrowsVariants({ variant })}
      />
    </Button>
  );
};

export const carouselDotsVariants = cva({
  base: "h-2 w-2 rounded-full border-2",
  variants: {
    variant: {
      default:
        "border-foreground data-[active=true]:bg-primary data-[active=true]:border-primary",
      white:
        "border-background data-[active=true]:bg-background data-[active=true]:border-background",
      uwezo:
        "data-[active=true]:bg-primary data-[active=true]:border-primary h-1.5 w-4 border-neutral-500 bg-neutral-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface CarouselDotsProps extends VariantProps<typeof carouselDotsVariants> {
  visibleDots?: number;
}

export const CarouselDots: FC<CarouselDotsProps> = ({
  visibleDots = Infinity,
  variant,
}) => {
  const { api, selectedItem } = useCarousel();

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-3",
        variant === "uwezo" && "gap-1",
      )}
    >
      {api?.scrollSnapList().map((_, index) => {
        const totalSlides = api.scrollSnapList().length;
        const isActive = selectedItem === index;

        // get the indexes of visible dots
        let start = Math.max(0, selectedItem - Math.floor(visibleDots / 2));
        const end = Math.min(totalSlides, start + visibleDots);

        // handle visible dots when active reaches to the end of the list so all required dots are visible
        if (end === totalSlides) {
          start = Math.max(0, totalSlides - visibleDots);
        }

        // hide element if it is not visible
        if (!(index >= start && index < end)) {
          return null;
        }

        return (
          <Button
            variant="ghost"
            size="xs"
            key={index}
            onClick={() => api.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={isActive ? "step" : undefined}
            className="h-auto p-0"
          >
            <div
              data-active={isActive}
              className={cn(carouselDotsVariants({ variant }))}
            ></div>
          </Button>
        );
      })}
    </div>
  );
};
