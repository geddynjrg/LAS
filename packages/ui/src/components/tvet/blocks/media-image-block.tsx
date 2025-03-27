import type { FC } from "react";

import { cn } from "@workspace/ui/lib/utils";

interface Media {
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
}

export interface MediaBlockProps {
  className?: string;
  block_type: "media";
  media?: Media;
}

export const MediaBlock: FC<MediaBlockProps> = ({ media, className }) => {
  if (!media) return null;
  return (
    <section
      className={cn("app-container bg-neutral-200 px-4 py-12", className)}
    >
      <MediaItem media={media} />
    </section>
  );
};

const MediaItem: FC<{ media: Media }> = ({ media }) => {
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
