import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { cn } from "@workspace/ui/lib/utils";

import { IconLogoECitizen } from "@/components/icon-logo-e-citizen";

export const AppFooter: FC = () => {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "bg-stepper-hover-foreground py-15 mt-auto flex w-full flex-col items-center gap-[1.625rem] px-4 text-center text-neutral-100",
      )}
    >
      <IconLogoECitizen />

      <p className="typo-body-small">
        {t("Components.app-footer.title-message")}
      </p>

      <Anchor href="/">{t("Navigation.home")}</Anchor>
      <Anchor href="#">{t("Navigation.national")}</Anchor>
      <Anchor href="#">{t("Navigation.countries")}</Anchor>
      <Anchor href="#">{t("Navigation.help-and-support")}</Anchor>
      <Anchor href="#">{t("Navigation.terms-and-conditions")}</Anchor>
      <Anchor href="#">{t("Navigation.privacy-policy")}</Anchor>

      <div className="typo-body-extra-small border-t border-solid border-neutral-700 px-12 pt-[1.625rem]">
        &copy; 2025 eCitizen. {t("Components.app-footer.rights")}
      </div>
    </div>
  );
};

interface AnchorProps {
  href: string;
  children?: string;
}

const Anchor: FC<AnchorProps> = ({ href, children }) => (
  <Link href={href} className="text-neutral-100">
    {children}
  </Link>
);
