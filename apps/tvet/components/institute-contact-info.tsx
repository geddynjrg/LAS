import { IconMail, IconPhone } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC, ReactNode } from "react";

import { Underline } from "@workspace/ui/components/underline";

import { Heading } from "@/components/heading";

export interface InstituteContactInfoProps {
  contact_text?: ReactNode;
  phone?: string;
  email?: string;
}

export const InstituteContactInfo: FC<InstituteContactInfoProps> = ({
  phone,
  email,
}) => {
  const t = useTranslations("InstituteContactInfo");

  return (
    <section className="bg-theme-100 px-4 pb-12 pt-8">
      <div className="app-container flex flex-col items-center">
        <Heading type="h3">{t("doYouHaveQuestions")}</Heading>
        <div className="mt-4 flex flex-col items-center gap-4">
          {t("getInContact")}
          <br />
          <Underline asChild>
            <a href={`tel:${phone}`}>
              <IconPhone /> {phone}
            </a>
          </Underline>
          <Underline asChild>
            <a href={`mailto:${email}`}>
              <IconMail className="mr-2" />
              {email}
            </a>
          </Underline>
        </div>
      </div>
    </section>
  );
};
