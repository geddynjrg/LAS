import { IconDownload, IconWindowMaximize } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, PropsWithChildren, ReactNode } from "react";

import { Underline } from "@workspace/ui/components/underline";
import { cn } from "@workspace/ui/lib/utils";

export interface SponsorshipCardProps extends PropsWithChildren {
  title: string;
  description: ReactNode;
  applicationFormHref?: string;
  websiteHref?: string;
}

export const SponsorshipCard: FC<SponsorshipCardProps> = ({
  children,
  title,
  description,
  applicationFormHref,
  websiteHref,
}) => {
  const t = useTranslations("SponsorshipCard");

  return (
    <div className={cn("flex flex-col gap-4")}>
      <div className="flex flex-col gap-3 rounded-2xl bg-neutral-100 px-4 py-6 shadow-[var(--box-shadow-elevation-02)]">
        <h5 className="typo-h5">{title}</h5>
        <div>{description}</div>
        {applicationFormHref && (
          <Underline asChild>
            <Link href={applicationFormHref}>
              {t("downloadApplicationForm")}
              <IconDownload className="ml-2" />
            </Link>
          </Underline>
        )}
        {websiteHref && (
          <Underline asChild>
            <Link href={websiteHref}>
              {t("readMoreOnWebsite")}
              <IconWindowMaximize className="ml-2" />
            </Link>
          </Underline>
        )}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
};
