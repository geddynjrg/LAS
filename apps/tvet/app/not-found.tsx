import { IconHome } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";

export default function NotFoundPage() {
  const t = useTranslations("NotFoundPage");

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="space-y-3 text-center">
        <h2 className="typo-h2">{t("title")}</h2>
        <div className="typo-body mt-8">{t("description")}</div>

        <div className="mt-8 flex flex-col items-center justify-center">
          <Button variant="ghost" asChild className="text-foreground">
            <Link href="/">
              <IconHome className="size-4" />
              {t("goToHome")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
