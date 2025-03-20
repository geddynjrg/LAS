import { IconChevronDown, IconMail, IconPhone } from "@tabler/icons-react";

import { Button } from "@workspace/ui/components/button";

import { Heading } from "@/components/heading";
import { HeroSection } from "@/components/hero-section";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import { PageComponents } from "@/components/page-components";
import { PageNode } from "@/components/page-nodes";
import { ScrollTo } from "@/components/scroll-to";
import { getPageData } from "@/lib/api/getPageData";

interface PageProps {
  params: Promise<Record<string, string[]>>;
  searchParams: Promise<{ page?: string }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;

  console.log(params.path);
  const pageData = await getPageData();

  if (!pageData?.data) {
    throw Error("Page not found");
  }

  return pageData.data && <PageNode node={pageData} />;
}
