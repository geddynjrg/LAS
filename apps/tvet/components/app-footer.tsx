import { IconChevronRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { type FC, type ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { Underline } from "@workspace/ui/components/underline";

export interface AppFooterProps {
  institutions?: { id: string | number; title: string; path_alias: string }[];
}

export const AppFooter: FC<AppFooterProps> = ({ institutions }) => {
  const t = useTranslations("Menu");

  return (
    <footer className="bg-theme-500 text-primary-foreground mt-auto">
      <Container className="grid gap-6 p-4 lg:grid-cols-2 xl:grid-cols-3">
        <FooterNavGroup title={t("navigate")}>
          <FooterNavItem href="/">{t("home")}</FooterNavItem>
          <FooterNavItem href="/courses">{t("courses")}</FooterNavItem>
          <FooterNavItem href="/sponsorships">
            {t("sponsorships")}
          </FooterNavItem>
          <FooterNavItem href="/apply">{t("apply")}</FooterNavItem>
          <FooterNavItem href="/contact">{t("contact")}</FooterNavItem>
        </FooterNavGroup>
        {(institutions?.length ?? 0) > 0 && (
          <FooterNavGroup title={t("institutions")}>
            {institutions?.map((institution) => (
              <FooterNavItem key={institution.id} href={institution.path_alias}>
                {institution.title}
              </FooterNavItem>
            ))}
          </FooterNavGroup>
        )}
      </Container>
      <SubFooter />
    </footer>
  );
};

interface FooterNavGroupProps {
  title: string;
  children?: ReactNode;
}

const FooterNavGroup: FC<FooterNavGroupProps> = ({ title, children }) => {
  return (
    <div className="border-primary-foreground lg:border-primary-foreground/20 border-t py-4 first:border-t-0 lg:border-0 lg:border-l lg:pl-8">
      <p className="typo-body-large font-bold">{title}</p>
      <ul className="text-primary-foreground mt-2 list-none space-y-2">
        {children}
      </ul>
    </div>
  );
};

export interface FooterNavItemProps {
  href: string;
  children?: ReactNode;
}

export const FooterNavItem: FC<FooterNavItemProps> = ({ href, children }) => {
  return (
    <li>
      <Underline asChild variant="white">
        <Link href={href}>
          <IconChevronRight className="mr-1" size={20} />
          {children}
        </Link>
      </Underline>
    </li>
  );
};

const SubFooter: FC = () => {
  return (
    <div className="bg-theme-600 text-primary-foreground flex justify-center gap-8 px-4 py-2">
      <p className="mr-auto">&copy; {new Date().getFullYear()}</p>
      {/* <Link href="/#" className="text-primary-foreground">
        Accessibility
      </Link>
      <Link href="/#" className="text-primary-foreground">
        Privacy Policy
      </Link> */}
    </div>
  );
};
