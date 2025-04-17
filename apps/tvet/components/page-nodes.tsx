import dynamic from "next/dynamic";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Skeleton } from "@workspace/ui/components/skeleton";

import type { CourseNodeType } from "@/lib/api/schema/node/course-node.schema";
import type { GenericNodeType } from "@/lib/api/schema/node/generic-node.schema";
import type { InstitutionNodeType } from "@/lib/api/schema/node/institution-node.schema";
import type { LandingNodeType } from "@/lib/api/schema/node/landing-node.schema";
import type { NodeType } from "@/lib/api/schema/node/node-types";

export interface PageComponentsProps {
  node: NodeType;
}

const DynamicLandingPageNode = dynamic(
  () => import("@/components/page-nodes/landing-node"),
  {
    loading: () => <NodeSkeleton />,
  },
);
const DynamicCoursePageNode = dynamic(
  () => import("@/components/page-nodes/course-node"),
  {
    loading: () => <NodeSkeleton />,
  },
);
const DynamicInstitutionPageNode = dynamic(
  () => import("@/components/page-nodes/institute-node"),
  {
    loading: () => <NodeSkeleton />,
  },
);
const DynamicGenericPageNode = dynamic(
  () => import("@/components/page-nodes/generic-node"),
  {
    loading: () => <NodeSkeleton />,
  },
);

export const PageNode: FC<PageComponentsProps> = ({ node }) => {
  if (!node.data) {
    throw new Error("No content");
  }

  switch (node.data.type) {
    case "institution":
      return <DynamicInstitutionPageNode {...(node as InstitutionNodeType)} />;

    case "course":
      return <DynamicCoursePageNode {...(node as CourseNodeType)} />;

    case "landing":
      return <DynamicLandingPageNode {...(node as LandingNodeType)} />;

    default:
      return <DynamicGenericPageNode {...(node as GenericNodeType)} />;
  }
};

export const NodeSkeleton: FC = () => {
  return (
    <div className="flex flex-col space-y-5">
      <Skeleton className="relative aspect-[4/5] max-h-[600px] w-full bg-gray-300 sm:aspect-[16/9]" />

      <Container className="space-y-2">
        <Skeleton className="h-6 w-4/5 bg-gray-300" />
        <Skeleton className="h-6 w-3/5 bg-gray-300" />
        <Skeleton className="h-[175px] w-full rounded-xl bg-gray-300" />
        <Skeleton className="mt-8 h-4 w-4/5 bg-gray-300" />
        <Skeleton className="ml-3 h-4 w-2/5 bg-gray-300" />
        <Skeleton className="ml-3 h-4 w-1/5 bg-gray-300" />
        <Skeleton className="ml-3 h-4 w-1/5 bg-gray-300" />

        <Skeleton className="ml-3 mt-8 h-4 w-4/5 bg-gray-300" />
        <Skeleton className="ml-3 h-4 w-4/5 bg-gray-300" />
        <Skeleton className="ml-3 h-4 w-3/5 bg-gray-300" />
        <Skeleton className="mb-10 h-[125px] w-full rounded-xl bg-gray-300" />
      </Container>
    </div>
  );
};
