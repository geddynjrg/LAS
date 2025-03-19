import type { FC, ReactElement, ReactNode } from "react";

import { IconFacebook } from "@workspace/ui/components/icon/icon-facebook";
import { IconInstagram } from "@workspace/ui/components/icon/icon-instagram";
import { IconTikTok } from "@workspace/ui/components/icon/icon-tiktok";
import { IconX } from "@workspace/ui/components/icon/icon-x";
import { IconYoutube } from "@workspace/ui/components/icon/icon-youtube";

import type { SocialBlockType } from "@/lib/api/types";

export interface SocialBlockProps extends SocialBlockType {}

export const SocialBlock: FC<SocialBlockProps> = ({ social_links }) => {
  return (
    <section className="flex flex-col items-center bg-neutral-200 pb-8 pt-6">
      <div className="typo-h5">Follow us!</div>

      <div className="mt-5 flex gap-4">
        {social_links.map((link) =>
          getSocialMediaLink(link.platform, link.url),
        )}
      </div>
    </section>
  );
};

function getSocialMediaLink(platform: string, url: string) {
  let icon: ReactElement | null = null;
  switch (platform) {
    case "facebook":
      icon = <IconFacebook key={platform} />;
      break;

    case "tiktok":
      icon = <IconTikTok key={platform} />;
      break;

    case "instagram":
      icon = <IconInstagram key={platform} />;
      break;

    case "x":
    case "twitter":
      icon = <IconX key={platform} />;
      break;

    case "youtube":
      icon = <IconYoutube key={platform} />;
      break;

    default:
      icon = <div>{platform}</div>;
      break;
  }
  return (
    <a
      href={url}
      key={platform}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center"
    >
      {icon}
    </a>
  );
}
