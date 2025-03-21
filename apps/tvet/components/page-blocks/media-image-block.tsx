import type { FC, ReactNode } from "react";

import type { MediaBlockBlockType } from "@/lib/api/schema/block/media-block.schema";

export interface MediaBlockProps extends MediaBlockBlockType {}

export const MediaBlock: FC<MediaBlockProps> = ({ media }) => {
  return (
    <section className="app-container bg-neutral-200 px-4 py-12">
      {media?.map((media) => <MediaItem media={media} />)}
    </section>
  );
};

const MediaItem: FC<{ media: MediaBlockBlockType["media"][0] }> = ({
  media,
}) => {
  switch (media.type) {
    case "image":
      return (
        <img
          src={media.url}
          alt={media.alt}
          width={media.width}
          height={media.height}
          className="w-full rounded-xl"
        />
      );
    case "video":
      return (
        <video controls className="w-full rounded-xl" muted>
          <source src={media.url} type={media.mime_type} />
        </video>
      );
    default:
      return null;
  }
};
