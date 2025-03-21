import { z } from "zod";

import { CourseNodeSchema } from "@/lib/api/schema/node/course-node.schema";
import { GenericNodeSchema } from "@/lib/api/schema/node/generic-node.schema";
import { InstitutionNodeSchema } from "@/lib/api/schema/node/institution-node.schema";
import { LandingNodeSchema } from "@/lib/api/schema/node/landing-node.schema";

export const NodeSchema = z.union([
  InstitutionNodeSchema,
  CourseNodeSchema,
  GenericNodeSchema,
  LandingNodeSchema,
]);

export type NodeType = z.infer<typeof NodeSchema>;
