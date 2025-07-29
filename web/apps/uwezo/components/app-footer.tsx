import {
  IconBrandTwitterFilled,
  IconDeviceMobile,
  IconHomeFilled,
  IconMail,
} from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Children, FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { IconFacebookInverted } from "@workspace/ui/components/icon/icon-facebook-inverted";
import { cn } from "@workspace/ui/lib/utils";

import type { SiteInformationResponse } from "@/lib/api/schema/site-info/site-info.schema";
import { getSiteInfo } from "@/lib/api/site-info";

export const AppFooter: FC = async () => {
  const t = await getTranslations("Footer");

  let siteInfo: SiteInformationResponse | null = null;

  try {
    siteInfo = await getSiteInfo();
  } catch (error) {
    console.error("Failed to fetch site info:", error);
    // Fallback to hardcoded values if API fails
  }

  // Fallback data
  const defaultSiteData = {
    site: {
      name: "Uwezo Fund",
      contact: {
        address: "Lonrho House, 16th Floor, Standard Street",
        po_box: "P. O. Box 42009 – 00100, Nairobi",
        phone: "+254 0776 154 215",
        email: "info@uwezo.go.ke",
      },
    },
    useful_links: [
      {
        id: "1",
        title: "Staff Mail",
        url: "https://mail.kenya.go.ke",
        external: true,
      },
      { id: "2", title: "MyGov", url: "https://mygov.go.ke", external: true },
      {
        id: "3",
        title: "eCitizen",
        url: "https://ecitizen.go.ke",
        external: true,
      },
      {
        id: "4",
        title: "Public Service Jobs",
        url: "https://psckenyajobs.go.ke",
        external: true,
      },
    ],
  };

  const data = siteInfo?.data || defaultSiteData;

  return (
    <footer className="bg-primary text-primary-foreground">
      <Container className="flex basis-1/3 flex-col pt-8 md:flex-row md:justify-center md:gap-8">
        <FooterNavGroup title={t("usefulLinks")}>
          {data.useful_links.map((link, index) => (
            <FooterNavItem
              key={link.id || index}
              href={link.url}
              hasBorder={index < data.useful_links.length - 1}
              isExternal={link.external}
            >
              {link.title}
            </FooterNavItem>
          ))}
        </FooterNavGroup>
        <FooterNavGroup title={t("quickContacts")}>
          <FooterNavItem>
            <IconHomeFilled size={20} />
            {data.site.name}
          </FooterNavItem>
          <FooterNavItem>
            <IconHomeFilled size={20} />
            {data.site.contact.address}
          </FooterNavItem>
          <FooterNavItem>
            <IconDeviceMobile size={20} />
            {data.site.contact.po_box}
          </FooterNavItem>
          <FooterNavItem>
            <IconDeviceMobile size={20} />
            Tel. {data.site.contact.phone}
          </FooterNavItem>
          <FooterNavItem
            href={`mailto:${data.site.contact.email}`}
            hasBorder={false}
          >
            <IconMail size={20} />
            {data.site.contact.email}
          </FooterNavItem>
        </FooterNavGroup>
      </Container>
      <SubFooter siteName={data.site.name} />
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
  isExternal?: boolean;
}

const FooterNavItem: FC<FooterNavItemProps> = ({
  href,
  children,
  hasBorder = true,
  isExternal = false,
}) => {
  const Comp = href ? Link : "div";
  const linkProps = isExternal
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Comp
      href={href as string}
      className={cn(
        "border-primary-foreground/10 text-primary-foreground typo-body-small flex max-w-[380px] flex-row gap-2.5 pb-1",
        hasBorder && "border-b",
      )}
      {...(href ? linkProps : {})}
    >
      {children}
    </Comp>
  );
};

interface SubFooterProps {
  siteName: string;
}

const SubFooter: FC<SubFooterProps> = ({ siteName }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-primary-hover">
      <Container className="text-primary-foreground typo-body-small flex justify-between gap-4 pb-2.5 pt-5">
        <div>
          <p>
            &copy; Copyright {currentYear} | {siteName}. | All Rights Reserved.
          </p>
        </div>
        {/* <div className="flex flex-row gap-2">
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
        </div> */}
      </Container>
    </div>
  );
};
