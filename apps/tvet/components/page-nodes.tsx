import dynamic from "next/dynamic";
import type { FC } from "react";

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
    loading: () => <p>Loading...</p>,
  },
);
const DynamicCoursePageNode = dynamic(
  () => import("@/components/page-nodes/course-node"),
  {
    loading: () => <p>Loading...</p>,
  },
);
const DynamicInstitutionPageNode = dynamic(
  () => import("@/components/page-nodes/institute-node"),
  {
    loading: () => <p>Loading...</p>,
  },
);
const DynamicGenericPageNode = dynamic(
  () => import("@/components/page-nodes/generic-node"),
  {
    loading: () => <p>Loading...</p>,
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
