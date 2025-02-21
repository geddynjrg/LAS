import { useTranslations } from "next-intl";
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

      <Anchor href="#">{t("Components.app-footer.home")}</Anchor>
      <Anchor href="#">{t("Components.app-footer.national")}</Anchor>
      <Anchor href="#">{t("Components.app-footer.countries")}</Anchor>
      <Anchor href="#">{t("Components.app-footer.help-and-support")}</Anchor>
      <Anchor href="#">
        {t("Components.app-footer.terms-and-conditions")}
      </Anchor>
      <Anchor href="#">{t("Components.app-footer.privacy-policy")}</Anchor>

      <div className="typo-body-extra-small border-t border-solid border-neutral-700 px-12 pt-[1.625rem]">
        © 2024 eCitizen. {t("Components.app-footer.rights")}
      </div>
    </div>
  );
};

interface AnchorProps {
  href?: string;
  children?: string;
}

const Anchor: FC<AnchorProps> = ({ href, children }) => (
  <a href={href} className="text-neutral-100">
    {children}
  </a>
);
