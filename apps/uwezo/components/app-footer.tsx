import {
  IconBrandTwitterFilled,
  IconDeviceMobile,
  IconHomeFilled,
  IconMail,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Children, FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { IconFacebookInverted } from "@workspace/ui/components/icon/icon-facebook-inverted";
import { cn } from "@workspace/ui/lib/utils";

export const AppFooter: FC = () => {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-primary text-primary-foreground">
      <Container className="flex basis-1/3 flex-col pt-8 md:flex-row md:justify-center md:gap-8">
        <FooterNavGroup title={t("relatedAgencies")}>
          <FooterNavItem href="/#">Hustler Fund</FooterNavItem>
          <FooterNavItem href="/#">Youth Fund</FooterNavItem>
          <FooterNavItem href="/#">New KCC</FooterNavItem>
          <FooterNavItem href="/#" hasBorder={false}>
            Women Fund
          </FooterNavItem>
        </FooterNavGroup>
        <FooterNavGroup title={t("usefulLinks")}>
          <FooterNavItem href="/#">Staff Mail</FooterNavItem>
          <FooterNavItem href="/#">MyGov</FooterNavItem>
          <FooterNavItem href="/#">eCitizen</FooterNavItem>
          <FooterNavItem href="/#" hasBorder={false}>
            Public Service Jobs
          </FooterNavItem>
        </FooterNavGroup>
        <FooterNavGroup title={t("quickContacts")}>
          <FooterNavItem>
            <IconHomeFilled size={20} />
            Uwezo Fund
          </FooterNavItem>
          <FooterNavItem>
            <IconHomeFilled size={20} />
            Lonrho House, 16th Floor, Standard Street
          </FooterNavItem>
          <FooterNavItem>
            <IconDeviceMobile size={20} />
            P. O. Box 42009 – 00100, Nairobi
          </FooterNavItem>
          <FooterNavItem>
            <IconDeviceMobile size={20} />
            Tel. +254 0776 154 215
          </FooterNavItem>
          <FooterNavItem href="mailto:info@uwezo.go.ke" hasBorder={false}>
            <IconMail size={20} />
            info@uwezo.go.ke
          </FooterNavItem>
        </FooterNavGroup>
      </Container>
      <SubFooter />
    </footer>
  );
};

export interface FooterNavGroupProps {
  title: string;
  children?: ReactNode;
}

export const FooterNavGroup: FC<FooterNavGroupProps> = ({
  children,
  title,
}) => {
  const arrayChildren = Children.toArray(children);

  return (
    <div className="flex flex-1 flex-col pb-11 md:pb-1">
      <p className="typo-h5 border-primary-foreground w-full max-w-[250px] border-b-2 pb-3.5 font-bold">
        {title}
      </p>
      <ul className="text-primary-foreground mt-2 flex list-none flex-col gap-2">
        {arrayChildren.map((child, index) => {
          return <li key={index}>{child}</li>;
        })}
      </ul>
    </div>
  );
};

interface FooterNavItemProps {
  href?: string;
  children?: ReactNode;
  hasBorder?: boolean;
}

const FooterNavItem: FC<FooterNavItemProps> = ({
  href,
  children,
  hasBorder = true,
}) => {
  const Comp = href ? Link : "div";

  return (
    <Comp
      href={href as string}
      className={cn(
        "border-primary-foreground/10 text-primary-foreground typo-body-small flex max-w-[380px] flex-row gap-2.5 pb-1",
        hasBorder && "border-b",
      )}
    >
      {children}
    </Comp>
  );
};

const SubFooter: FC = () => {
  return (
    <div className="bg-primary-hover">
      <Container className="text-primary-foreground typo-body-small flex justify-between gap-4 pb-2.5 pt-5">
        <div>
          <p>&copy; Copyright 2025 | Uwezo Fund. | All Rights Reserved.</p>
        </div>
        <div className="flex flex-row gap-2">
          <Link
            href={"#"}
            className="bg-twitter-background text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full"
          >
            <IconBrandTwitterFilled width={16} height={16} />
          </Link>
          <Link
            href={"#"}
            className="bg-facebook-background flex h-8 w-8 items-center justify-center rounded-full"
          >
            <IconFacebookInverted height={17} width={17} />
          </Link>
        </div>
      </Container>
    </div>
  );
};
