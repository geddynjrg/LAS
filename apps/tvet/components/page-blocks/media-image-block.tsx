import type { FC, ReactNode } from "react";

import type { MediaBlockBlockType } from "@/lib/api/schema/block/media-block.schema";

export interface MediaBlockProps extends MediaBlockBlockType {}

export const MediaBlock: FC<MediaBlockProps> = ({ media }) => {
  return (
    <section className="app-container bg-neutral-200 px-4 py-12">
      {media?.map((media) => (
        <img
          src={media.url}
          alt={media.alt}
          width={media.width}
          height={media.height}
          className="w-full rounded-xl"
        />
      ))}
    </section>
  );
};
