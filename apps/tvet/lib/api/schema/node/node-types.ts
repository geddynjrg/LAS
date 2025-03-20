import { z } from "zod";

import { CourseNodeSchema } from "@/lib/api/schema/node/course-node.schema";
import { GenericNodeSchema } from "@/lib/api/schema/node/generic-node.schema";
import { InstitutionNodeSchema } from "@/lib/api/schema/node/institution-node.schema";

export const NodeSchema = z.union([
  InstitutionNodeSchema,
  CourseNodeSchema,
  GenericNodeSchema,
]);

export type NodeType = z.infer<typeof NodeSchema>;
