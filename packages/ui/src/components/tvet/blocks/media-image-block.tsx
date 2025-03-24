import type { FC } from "react";

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
  block_type: "media";
  media: Media[];
}

export const MediaBlock: FC<MediaBlockProps> = ({ media }) => {
  return (
    <section className="app-container bg-neutral-200 px-4 py-12">
      {media?.map((media, index) => (
        <MediaItem media={media} key={`media-${index}`} />
      ))}
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
