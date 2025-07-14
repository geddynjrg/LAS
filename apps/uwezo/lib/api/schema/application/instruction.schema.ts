import { z } from "zod";

import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { AvailableLanguagesSchema } from "@/lib/api/schema/language-availability.schema";
import { LanguageSchema } from "@/lib/api/schema/language.schema";

// Schema for example images
export const ExampleImageSchema = z.object({
  fid: z.string(),
  filename: z.string(),
  url: z.string(),
  size: z.number(),
  mime_type: z.string(),
});

// Schema for document requirements
export const DocumentRequirementSchema = z.object({
  title: z.string(),
  subtitle: DescriptionSchema.nullable(),
  link: z
    .object({
      uri: z.string(),
      title: z.string(),
    })
    .nullable()
    .optional(),
  example_images: z.array(ExampleImageSchema).optional(),
  examples_subtitle: z.string().nullable().optional(),
});

// Main application instructions schema
export const ApplicationInstructionsSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: DescriptionSchema.nullable(),
  documents_required: z.array(DocumentRequirementSchema),
  url: z.string(),
  language: LanguageSchema,
});

// Schema for the full API response
export const ApplicationInstructionsResponseSchema = z.object({
  data: ApplicationInstructionsSchema,
  meta: z.object({
    timestamp: z.number(),
    version: z.string(),
    language: z.object({
      current: z.string().optional(),
      default: z.string().optional(),
      available: AvailableLanguagesSchema,
    }),
  }),
});

// Export types
export type ExampleImage = z.infer<typeof ExampleImageSchema>;
export type DocumentRequirement = z.infer<typeof DocumentRequirementSchema>;
export type ApplicationInstructions = z.infer<
  typeof ApplicationInstructionsSchema
>;
export type ApplicationInstructionsResponse = z.infer<
  typeof ApplicationInstructionsResponseSchema
>;

// Legacy export for backward compatibility
export type ApplicationInstructionsType = ApplicationInstructions;
