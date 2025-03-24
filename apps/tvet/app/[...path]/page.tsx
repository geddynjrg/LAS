import { PageNode } from "@/components/page-nodes";
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
