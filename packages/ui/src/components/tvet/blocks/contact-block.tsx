import { IconMail, IconPhone } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { Underline } from "@workspace/ui/components/underline";
import { cn } from "@workspace/ui/lib/utils";

import Link from "../../../../../../apps/docs/mocks/link";

export interface ContactBlockProps {
  className?: string;

  block_type: "contact";
  title?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  apply_button?: boolean | null;
}

export const ContactBlock: FC<ContactBlockProps> = ({
  className,
  title,
  description,
  phone,
  email,
  apply_button,
}) => {
  const t = useTranslations("ContactBlock");

  return (
    <section className={cn("bg-theme-100", className)}>
      <Container>
        <div className="flex flex-col items-center pb-6 pt-8">
          <Heading type="h3">{title}</Heading>
          <div className="mt-4 flex flex-col items-center gap-4">
            {description}
            <br />
            {phone && (
              <Underline asChild>
                <a href={phone.startsWith("tel:") ? phone : `tel:${phone}`}>
                  <IconPhone /> {phone}
                </a>
              </Underline>
            )}
            {email && (
              <Underline asChild>
                <a
                  href={email.startsWith("mailto:") ? email : `mailto:${email}`}
                >
                  <IconMail className="mr-2" />
                  {email}
                </a>
              </Underline>
            )}
          </div>
        </div>
        {apply_button === true && (
          <div className="flex items-center py-8">
            <Button className="md:max-w-3xs mx-auto w-full" asChild>
              <Link href="/apply" aria-label={t("applyNow")}>
                {t("applyNow")}
              </Link>
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
};
