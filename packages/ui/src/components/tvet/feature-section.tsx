import type { FC, ReactNode } from "react";

import { IconBlock } from "@workspace/ui/components/icon-block";
import { cn } from "@workspace/ui/lib/utils";

export interface FeatureInfo {
  title: string;
  text: string;
  icon: ReactNode;
}

export interface FeatureSectionProps {
  features: FeatureInfo[];
  children?: ReactNode;
  className?: string;
}

export const FeatureSection: FC<FeatureSectionProps> = ({
  features,
  children,
  className,
}) => {
  return (
    <section className={cn("px-4 pb-20 pt-6 lg:pt-20", className)}>
      <div className="app-container grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
        {features.map((feature, index) => (
          <IconBlock key={index} title={feature.title} icon={feature.icon}>
            {feature.text}
          </IconBlock>
        ))}
      </div>
      <div className="lg:w-2xl mt-8 lg:mx-auto lg:mt-16 lg:text-center">
        {children}
      </div>
    </section>
  );
};
