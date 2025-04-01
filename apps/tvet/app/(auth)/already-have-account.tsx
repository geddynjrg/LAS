import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

export interface AlreadyHaveAccountProps {
  showDescription?: boolean;
}

export const AlreadyHaveAccount: FC<AlreadyHaveAccountProps> = ({
  showDescription,
}) => {
  const t = useTranslations("SignUpPage");

  return (
    <div className="flex justify-center gap-2 pt-4">
      {showDescription && (
        <p className="typo-body-medium">{t("alreadyHaveAccount")}</p>
      )}

      <Link href="/login" className="text-primary underline">
        {t("login")}
      </Link>
    </div>
  );
};
