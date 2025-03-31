import { PageNode } from "@/components/page-nodes";
import { getNode } from "@/lib/api/node";

interface PageProps {
  params: Promise<Record<string, string[]>>;
  searchParams: Promise<{ page?: string }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;

  console.log(params.path);
  const pageData = await getNode();

  if (!pageData?.data) {
    throw Error("Page not found");
  }

  return pageData.data && <PageNode node={pageData} />;
}
