import dynamic from "next/dynamic";
import type { FC } from "react";

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
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl bg-gray-500" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px] bg-gray-500" />
        <Skeleton className="h-4 w-[200px] bg-gray-500" />
      </div>
    </div>
  );
};
