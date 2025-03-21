import type { FC } from "react";

import CoursePageNode from "@/components/page-nodes/course-node";
import GenericPageNode from "@/components/page-nodes/generic-node";
import InstitutionPageNode from "@/components/page-nodes/institute-node";
import LandingPageNode from "@/components/page-nodes/landing-node";
import type { CourseNodeType } from "@/lib/api/schema/node/course-node.schema";
import type { GenericNodeType } from "@/lib/api/schema/node/generic-node.schema";
import type { InstitutionNodeType } from "@/lib/api/schema/node/institution-node.schema";
import type { LandingNodeType } from "@/lib/api/schema/node/landing-node.schema";
import type { NodeType } from "@/lib/api/schema/node/node-types";

export interface PageComponentsProps {
  node: NodeType;
}

export const PageNode: FC<PageComponentsProps> = ({ node }) => {
  if (!node.data) {
    throw new Error("No content");
  }

  switch (node.data.type) {
    case "institution":
      return <InstitutionPageNode {...(node as InstitutionNodeType)} />;

    case "course":
      return <CoursePageNode {...(node as CourseNodeType)} />;

    case "landing":
      return <LandingPageNode {...(node as LandingNodeType)} />;

    default:
      return <GenericPageNode {...(node as GenericNodeType)} />;
  }
};
