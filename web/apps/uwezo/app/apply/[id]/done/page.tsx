import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { DataPair } from "@workspace/ui/components/data-pair";
import { IconCheck } from "@workspace/ui/components/icon-check";
import { cn } from "@workspace/ui/lib/utils";

export default async function Page() {
  const t = await getTranslations();

  return (
    <Container
      className={cn("grow-1 flex flex-col items-center gap-3", "mb-20 mt-7")}
    >
      <IconCheck className={cn("h-[4.75rem] w-[4.75rem]")} />

      <div className={cn("flex flex-col items-center gap-7", "text-center")}>
        <h2 className={cn("typo-h2")}>{t("ApplyPage.DonePage.title")}</h2>

        <p>{t("ApplyPage.DonePage.application-received-message")}</p>

        <DataPair className={cn("flex w-full flex-row gap-2")}>
          <Button
            className={cn("grow", "w-full max-w-[27rem] px-2")}
            variant="secondary"
            asChild
          >
            <Link href="#" download="Application" className="whitespace-nowrap">
              {t("ApplyPage.DonePage.download-application")}
            </Link>
          </Button>
          <Button
            className={cn(
              "grow",
              "w-full max-w-[27rem] whitespace-nowrap px-2",
            )}
            variant="secondary"
          >
            {t("ApplyPage.DonePage.send-to-email")}
          </Button>
        </DataPair>

        <p className={cn("border-t border-solid border-neutral-400", "pt-7")}>
          {t("ApplyPage.DonePage.tracking-hint")}
        </p>

        <Button className={cn("w-full max-w-[27rem]")} asChild>
          <Link href="/dashboard">
            {t("ApplyPage.DonePage.go-to-applications")}
          </Link>
        </Button>
      </div>
    </Container>
  );
}
