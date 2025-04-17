import Image from "next/image";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
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
  media?: Media[] | Media;
}

export const MediaBlock: FC<MediaBlockProps> = ({ media, className }) => {
  if (!media) return null;

  console.log({ media: media, is: Array.isArray(media) });
  return (
    <Container className={cn("bg-neutral-200 px-4 py-12", className)}>
      {Array.isArray(media) ? (
        <div className="relative flex aspect-video w-full">
          {media.map((item) => (
            <MediaItem key={item.id} media={item} />
          ))}
        </div>
      ) : (
        <MediaItem media={media} />
      )}
    </Container>
  );
};

const MediaItem: FC<{ media: Media }> = ({ media }) => {
  switch (media.type) {
    case "image":
      return (
        <Image
          fill
          src={media.url}
          alt={media.alt}
          className="rounded-xl"
          style={{
            objectFit: "cover",
            aspectRatio: `${media.width}/${media.height}`,
          }}
        />
      );
    case "media":
      return (
        <Image
          fill
          src={media.url}
          alt={media.alt}
          className="rounded-xl"
          style={{
            objectFit: "cover",
            aspectRatio: `${media.width}/${media.height}`,
          }}
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
