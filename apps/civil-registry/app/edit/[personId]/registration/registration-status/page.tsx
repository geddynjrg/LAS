"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { IconCheck } from "@workspace/ui/components/icon-check";
import { Loader } from "@workspace/ui/components/loader";
import { cn } from "@workspace/ui/lib/utils";

const MOCK_PERSON = {
  name: "Name Lastname",
  phone: "+254 343 234234",
};

export default function RegistrationStatusPage() {
  const t = useTranslations();

  const person = MOCK_PERSON;

  const [isConfirmed, setIsConfirmed] = useState(false);

  // imitate pending state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConfirmed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SectionWrap
        className={cn(
          "flex flex-col",
          "min-h-[calc(100vh-5.5rem)]",
          "text-neutral-800",
        )}
        hasTopPadding
        hasBottomPadding
      >
        <div>
          <div className={cn("flex justify-between", "typo-body-small")}>
            <div>09.08.24</div>
            <div>#134345345</div>
          </div>
          <h2 className={cn("typo-h2")}>
            {t("RegistrationStatusPage.birth-notification")}
          </h2>
        </div>

        {isConfirmed ? (
          <ConfirmedSection />
        ) : (
          <PendingSection name={person.name} phone={person.phone} />
        )}
      </SectionWrap>
      <ActionBar>
        {isConfirmed ? (
          <Button variant="secondary" className={cn("max-w-88 mx-auto w-full")}>
            {t("RegistrationStatusPage.close-form")}
          </Button>
        ) : (
          <Button variant="secondary" className={cn("max-w-88 mx-auto w-full")}>
            {t("Common.cancel")}
          </Button>
        )}
      </ActionBar>
    </>
  );
}

const ConfirmedSection: FC<{ className?: string }> = ({ className }) => {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "flex flex-grow flex-col items-center justify-center gap-3",
        "text-center",
        className,
      )}
    >
      <IconCheck className={cn("mb-5")} />
      <h3
        className={cn(
          "typo-h3",
          "max-w-90 w-full",
          "confirmation-text-opacity",
        )}
      >
        {t("RegistrationStatusPage.success-message")}
      </h3>
    </div>
  );
};

const PendingSection: FC<{
  name?: string;
  phone?: string;
  className?: string;
}> = ({ name, phone }) => {
  const t = useTranslations();
  return (
    <div
      className={cn(
        "flex flex-grow flex-col items-center justify-center gap-3",
        "text-center",
      )}
    >
      <Loader className={cn("mb-5")} />
      <h3 className={cn("typo-h3", "px-4", "max-w-90 w-full")}>
        {t("RegistrationStatusPage.waiting-confirmation")}
      </h3>
      <div>
        <div className={cn("typo-h5 bold")}>{name}</div>
        <div className={cn("typo-h5 font-normal")}>{phone}</div>
      </div>
    </div>
  );
};
