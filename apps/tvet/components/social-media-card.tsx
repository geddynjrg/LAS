import { IconVideo } from "@tabler/icons-react";
import type { FC } from "react";

import { IconFacebook } from "@workspace/ui/components/icon/icon-facebook";
import { IconInstagram } from "@workspace/ui/components/icon/icon-instagram";
import { IconTikTok } from "@workspace/ui/components/icon/icon-tiktok";
import { IconX } from "@workspace/ui/components/icon/icon-x";
import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const socialMediaVariants = cva({
  variants: {
    source: {
      facebook: "",
      x: "",
      tiktok: "",
      instagram: "",
    },
  },
  defaultVariants: {
    variant: undefined,
  },
});

export interface SocialMediaCardProps
  extends VariantProps<typeof socialMediaVariants> {
  imageUrl: string;
}

export const SocialMediaCard: FC<SocialMediaCardProps> = ({
  source,
  imageUrl,
}) => {
  return (
    <div className="relative size-[312px]">
      <img
        src={imageUrl}
        alt="Students in a classroom"
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute bottom-4 left-4">
        {source == "tiktok" && <IconTikTok className="size-8" />}
        {source == "facebook" && <IconFacebook className="size-8" />}
        {source == "x" && <IconX className="size-8" />}
        {source == "instagram" && <IconInstagram className="size-8" />}
      </div>
      <div className="absolute right-4 top-4">
        <IconVideo className="text-primary-foreground size-8" />
      </div>
    </div>
  );
};
