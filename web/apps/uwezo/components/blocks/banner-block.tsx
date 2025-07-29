import { type FC } from "react";

import { HeroSection } from "@workspace/ui/components/uwezo/hero-section";

import { ApplyButton } from "@/components/apply-button";
import type { BannerBlock } from "@/lib/api/schema";

export interface BannerBlockComponentProps {
  data: BannerBlock;
}

export const BannerBlockComponent: FC<BannerBlockComponentProps> = ({
  data,
}) => {
  const { title, text, button, help_text } = data;

  return (
    <HeroSection
      title={
        <>
          <span className="typo-display">{title}</span>
          {text && (
            <>
              <br />
              <span
                className="typo-h4 font-normal"
                dangerouslySetInnerHTML={{
                  __html: text.processed || text.value || "",
                }}
              />
            </>
          )}
        </>
      }
      backgroundAlt="Dynamic banner content"
      actions={
        <ApplyButton title={button?.[0]?.title} href={button?.[0]?.url} />
      }
    >
      {help_text && (
        <span
          className="typo-body-large"
          dangerouslySetInnerHTML={{
            __html: help_text.processed || help_text.value || "",
          }}
        />
      )}
    </HeroSection>
  );
};
