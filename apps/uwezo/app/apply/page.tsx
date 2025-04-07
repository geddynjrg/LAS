import { IconArrowLeft, IconPinEnd } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { Container } from "@workspace/ui/components/container";
import { Underline } from "@workspace/ui/components/underline";

import { ApplySideLogo } from "@/components/apply-side-logo";

export default function Page() {
  const t = useTranslations("ApplyPage");

  return (
    <div className="relative mt-4 flex flex-1 flex-col">
      <Container className="mb-8">
        <div className="border-b-1 flex flex-col gap-4 border-neutral-400 pb-8">
          <Button
            asChild
            variant="secondary"
            className="self-start text-neutral-700 max-md:w-full"
          >
            <Link href={"/"}>
              <IconArrowLeft />
              {t("backToFrontPage")}
            </Link>
          </Button>
          <h1 className="typo-h2">{t("needToKnowBefore")}</h1>
          <p className="typo-body-large">{t("description")}</p>
        </div>
      </Container>

      <h1 className="typo-h3 mb-8 px-4 md:mx-auto">{t("documentsRequired")}</h1>

      <Container className="space-y-8 px-0 pb-8 md:max-w-[600px]">
        <ApplyContentContainer>
          <SectionHeader index={1}>{t("validGroupSectionTitle")}</SectionHeader>
          <div className="flex flex-col items-center">
            <p className="typo-body-medium mb-3">{t("example")}</p>
            <Image
              className="md:border md:border-neutral-300 md:shadow-lg"
              src={"/images/sample-certificate.png"}
              alt="cert example"
              width={300}
              height={200}
            />
            <div className="flex flex-row gap-1">
              <Link href="#" className={"text-primary typo-link"}>
                <Underline
                  variant="primary"
                  className="text-primary items-center"
                >
                  {t("moreInfoAboutTheCertificate")}
                  <IconPinEnd className="scale-x-[-1]" />
                </Underline>
              </Link>
            </div>
          </div>
        </ApplyContentContainer>

        <ApplyContentContainer>
          <SectionHeader index={2}>
            {t("groupCreditHistorySectionTitle")}
          </SectionHeader>
          <div className="mb-4 px-4">
            <p className="typo-body-medium">{t("groupCreditHistory")}</p>
            <ul className="list-inside list-disc px-4 py-4">
              <li>{t("creditHistoryList.tableBankingLedger")}</li>
              <li>{t("creditHistoryList.dischargeCertificate")}</li>
              <li>{t("creditHistoryList.letterOfClearance")}</li>
              <li>{t("creditHistoryList.others")}</li>
            </ul>
            <p className="typo-body-medium">
              {t("kindlyProvideAllRelatedToYourGroup")}
            </p>
          </div>
          <div>
            <Carousel>
              <CarouselContent>
                <CarouselItem className="flex flex-col items-center">
                  <p className="typo-body-medium mb-3 font-bold">Example 1</p>
                  <Image
                    className="md:border md:border-neutral-300 md:shadow-lg"
                    src={"/images/cert-example.jpg"}
                    alt="ledger"
                    width={300}
                    height={200}
                  />
                </CarouselItem>
                <CarouselItem className="flex flex-col items-center">
                  <p className="typo-body-medium mb-3 font-bold">Example 2</p>
                  <Image
                    className="md:border md:border-neutral-300 md:shadow-lg"
                    src={"/images/cert-example.jpg"}
                    alt="ledger"
                    width={300}
                    height={200}
                  />
                </CarouselItem>
              </CarouselContent>
              <Link
                href="#"
                className={
                  "text-primary typo-link flex flex-row justify-center gap-1 px-4"
                }
              >
                <Underline
                  variant="primary"
                  className="text-primary items-center"
                >
                  {t("moreInfoAboutCredit")}
                  <IconPinEnd className="scale-x-[-1]" />
                </Underline>
              </Link>
              <CarouselControls />
            </Carousel>
          </div>
        </ApplyContentContainer>

        <ApplyContentContainer>
          <SectionHeader index={3}>{t("validGroupSectionTitle")}</SectionHeader>
          <div className="flex flex-col items-center">
            <p className="typo-body-medium mb-3 font-bold">
              {t("exampleOfNationalId")}
            </p>
            <Image
              src={"/images/id-example.jpg"}
              alt="national ID example"
              width={300}
              height={200}
            />
          </div>
          <p className="typo-body-medium px-4">{t("membersMustBeInformed")}</p>
        </ApplyContentContainer>
      </Container>
      <ActionBar>
        <Button className="px-22 mx-auto" asChild>
          <Link href="/apply/create">{t("beginFillingForm")}</Link>
        </Button>
      </ActionBar>
    </div>
  );
}

const SectionHeader: FC<{
  index: number;
  children: ReactNode;
}> = ({ index, children }) => {
  return (
    <div className="flex flex-row items-center gap-5">
      <div className="relative">
        <ApplySideLogo height={121} />
        <span className="typo-h1 text-primary-foreground absolute left-1/2 top-1/2 -translate-x-[calc(50%+5px)] -translate-y-1/2">
          {index}
        </span>
      </div>
      <h1 className="typo-h5">{children}</h1>
    </div>
  );
};

const ApplyContentContainer: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="md:bg-background md:rounded md:pb-8 md:pt-4">
      {children}
    </div>
  );
};
