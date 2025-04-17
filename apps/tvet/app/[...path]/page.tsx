import { PageNode } from "@/components/page-nodes";
import { getNodeByPath } from "@/lib/api/node";

interface PageProps {
  params: Promise<Record<string, string[]>>;
  searchParams: Promise<{ page?: string; perPage?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { page, perPage } = await searchParams;
  const pageData = await getNodeByPath({ page, perPage });

  if (!pageData?.data) {
    throw Error("Page not found");
  }

  return pageData.data && <PageNode node={pageData} />;
}
