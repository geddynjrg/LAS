import { getTranslations } from "next-intl/server";
import { type FC } from "react";

import { Container } from "@workspace/ui/components/container";

import { ApplyButton } from "@/components/apply-button";
import { TextBlockCard } from "@/components/blocks/text-block";
import type { TextBlocksContainer } from "@/lib/api/schema";

export interface TextBlocksComponentProps {
  data: TextBlocksContainer;
}

export const TextBlocksComponent: FC<TextBlocksComponentProps> = async ({
  data,
}) => {
  const { blocks, button } = data;
  const t = await getTranslations("FrontPage");

  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <>
      <Container className="my-9" asChild>
        <section>
          <h1 className="typo-h3 mb-4">{t("criteria.title")}</h1>

          <div className="border-primary typo-body-medium grid gap-4 border-t pt-4 md:grid-cols-2">
            <div className="grid gap-4">
              {blocks
                .filter((_, index) => index % 2 === 0)
                .map((block, index) => (
                  <TextBlockCard key={index * 2} block={block} />
                ))}
            </div>
            <div className="grid gap-4">
              {blocks
                .filter((_, index) => index % 2 === 1)
                .map((block, index) => (
                  <TextBlockCard key={index * 2 + 1} block={block} />
                ))}
            </div>
          </div>
        </section>
      </Container>

      <div className="py-7.5 bg-primary lg:bg-transparent">
        <Container className="flex">
          <ApplyButton
            className="lg:hover:bg-primary mx-auto max-lg:flex-1 lg:basis-1/2"
            title={button?.[0]?.title}
            href={button?.[0]?.url}
          />
        </Container>
      </div>
    </>
  );
};
