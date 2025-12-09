import { DescriptionSchema } from '@/lib/api/schema/description.schema';
import { AvailableLanguagesSchema } from '@/lib/api/schema/language-availability.schema';
import { LanguageSchema } from '@/lib/api/schema/language.schema';
import { z } from 'zod';

// Schema for taxonomy term
export const TaxonomyTermSchema = z.object({
  tid: z.number(),
  uuid: z.string(),
  name: z.string(),
  description: DescriptionSchema,
  weight: z.number(),
  parent_ids: z.array(z.number()),
  url: z.string(),
  language: LanguageSchema,
  limited_role: z.boolean().optional(), // For position_of_member vocabulary terms
});

// Schema for taxonomy vocabulary
export const TaxonomyVocabularySchema = z.object({
  vocabulary_id: z.string(),
  vocabulary_label: z.string(),
  vocabulary_description: z.string(),
  field_name: z.string(),
  entity_type: z.enum(['application', 'group_member']),
  cardinality: z.enum(['single', 'multiple']),
  auto_create: z.boolean(),
  terms: z.array(TaxonomyTermSchema),
  total_terms: z.number(),
});

// Schema for taxonomy vocabularies meta information
export const TaxonomyVocabulariesMetaSchema = z.object({
  timestamp: z.number(),
  version: z.string(),
  total_vocabularies: z.number(),
  language: z.object({
    current: z.string(),
    default: z.string(),
    available: AvailableLanguagesSchema,
  }),
});

// Schema for the full API response
export const TaxonomyVocabulariesResponseSchema = z.object({
  data: z.record(z.string(), TaxonomyVocabularySchema),
  meta: TaxonomyVocabulariesMetaSchema,
});

// Export types
export type TaxonomyTerm = z.infer<typeof TaxonomyTermSchema>;
export type TaxonomyVocabulary = z.infer<typeof TaxonomyVocabularySchema>;
export type TaxonomyVocabulariesMeta = z.infer<
  typeof TaxonomyVocabulariesMetaSchema
>;
export type TaxonomyVocabulariesResponse = z.infer<
  typeof TaxonomyVocabulariesResponseSchema
>;
