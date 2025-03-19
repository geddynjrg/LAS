import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";

export interface SuccessPageProps {
  params: Promise<{}>;
}

export default async function SuccessPage({}: SuccessPageProps) {
  return <SectionWrap hasBottomPadding>Success page</SectionWrap>;
}
