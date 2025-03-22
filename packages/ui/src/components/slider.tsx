import * as SliderPrimitive from "@radix-ui/react-slider";
import { useState, type FC, type ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface SliderProps {
  name?: string;
  disabled?: boolean;
  orientation?: React.AriaAttributes["aria-orientation"];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number | string;
  onValueChange?: (value: number) => void;
  startDecorator?: ReactNode;
  endDecorator?: ReactNode;
  thumbLabel?: (value?: number) => ReactNode;
  className?: string;
}

export const Slider: FC<SliderProps> = ({
  startDecorator,
  endDecorator,
  thumbLabel,
  defaultValue,
  onValueChange,
  className,
  ...props
}) => {
  const [value, setValue] = useState([
    typeof defaultValue === "string"
      ? Number(defaultValue)
      : (defaultValue ?? props.min ?? 0),
  ]);

  return (
    <div className={cn("mb-2 flex gap-2 text-neutral-500", className)}>
      {startDecorator && <div>{startDecorator}</div>}
      <SliderPrimitive.Root
        className="relative flex flex-1 touch-none select-none items-center"
        value={value}
        onValueChange={(value) => {
          setValue(value);
          onValueChange?.(value.at(0) as number);
        }}
        {...props}
        ref={ignoreSetCustomValidityError}
      >
        <SliderPrimitive.Track className="group relative h-2 grow overflow-hidden rounded-full border border-neutral-500 bg-neutral-200">
          <SliderPrimitive.Range className="bg-primary data-disabled:bg-neutral-400 absolute h-full" />
        </SliderPrimitive.Track>
        {value?.map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className={cn(
              "bg-background block size-6 cursor-pointer rounded-full border-2 border-neutral-500 transition-colors",
              "focus-visible-ring focus-visible:border-primary",
              "hover:border-primary",
              "disabled:pointer-events-none disabled:border-neutral-400",
            )}
          >
            {thumbLabel && (
              <span className="text-foreground absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap font-bold">
                {thumbLabel(value.at(i))}
              </span>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>

      {endDecorator && <div>{endDecorator}</div>}
    </div>
  );
};

// Radix Radiogroup does not work with Radix form validation yet
// https://stackoverflow.com/questions/77714493/how-to-fix-unhandled-runtime-error-typeerror-control-setcustomvalidity-in-nextj
function ignoreSetCustomValidityError(elem: HTMLDivElement | null) {
  if (elem) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elem as any).setCustomValidity = () => {};
  }
}
