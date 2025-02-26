import {
  IconDeviceMobile,
  IconHomeFilled,
  IconMail,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Children, FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";

export const AppFooter: FC = () => {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-primary text-primary-foreground">
      <Container className="flex basis-1/3 flex-col pt-8 md:flex-row md:justify-center md:gap-8">
        <FooterNavGroup title={t("relatedAgencies")}>
          <FooterNavItem href="/#">Hustler Fund</FooterNavItem>
          <FooterNavItem href="/#">Youth Fund</FooterNavItem>
          <FooterNavItem href="/#">New KCC</FooterNavItem>
          <FooterNavItem href="/#">Women Fund</FooterNavItem>
        </FooterNavGroup>
        <FooterNavGroup title={t("usefulLinks")}>
          <FooterNavItem href="/#">Staff Mail</FooterNavItem>
          <FooterNavItem href="/#">MyGov</FooterNavItem>
          <FooterNavItem href="/#">eCitizen</FooterNavItem>
          <FooterNavItem href="/#">Public Service Jobs</FooterNavItem>
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
          <FooterNavItem href="mailto:info@uwezo.go.ke">
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
}

const FooterNavItem: FC<FooterNavItemProps> = ({ href, children }) => {
  const Comp = href ? Link : "div";

  return (
    <Comp
      href={href as string}
      className="border-primary-foreground/10 text-primary-foreground typo-body-small flex max-w-[380px] flex-row gap-2.5 border-b pb-1"
    >
      {children}
    </Comp>
  );
};

const SubFooter: FC = () => {
  return (
    <div className="bg-primary-hover">
      <Container className="text-primary-foreground typo-body-small flex justify-between pb-2.5 pt-5">
        <p>&copy; Copyright 2023 | Uwezo Fund. | All Rights Reserved.</p>
      </Container>
    </div>
  );
};
