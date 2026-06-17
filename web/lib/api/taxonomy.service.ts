'use server';

import { getTaxonomyVocabularies } from '@/lib/api/application/taxonomy-vocabularies';
import { sanitizeGroupActivityOptions } from '@/lib/constants/group-activities-taxonomy';
import { prisma } from '@/lib/db/prisma';

// import type { TaxonomyVocabulary, TaxonomyTerm } from "@/lib/api/schema/application/taxonomy-vocabularies.schema";

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export interface TaxonomyOption {
  label: string;
  value: string;
  limitedRole?: boolean; // For position_of_member terms - indicates if only one allowed per application
}

function termsToOptions(
  terms: Array<{ name: string; weight: number; limitedRole?: boolean | null }>,
  sanitizeGroupActivities = false,
): TaxonomyOption[] {
  const options = terms
    .sort((a, b) => a.weight - b.weight)
    .map((term) => ({
      label: term.name,
      value: term.name,
      limitedRole: term.limitedRole ?? undefined,
    }));

  return sanitizeGroupActivities
    ? sanitizeGroupActivityOptions(options)
    : options;
}

/**
 * Get taxonomy options for a specific field
 * Fetches from cache first, then from API if cache is stale
 */
export async function getTaxonomyOptions(
  fieldName: string,
): Promise<TaxonomyOption[]> {
  try {
    // Check cache first
    const cached = await prisma.taxonomyVocabulary.findFirst({
      where: { fieldName },
      include: { terms: true },
    });

    // Check if cache is still valid
    if (cached && Date.now() - cached.lastSyncedAt.getTime() < CACHE_DURATION) {
      return termsToOptions(cached.terms, fieldName === 'group_activities');
    }

    // Try to fetch fresh data from API, but don't fail if it's not available
    try {
      await syncTaxonomyVocabularies();
    } catch (syncError) {
      console.warn(`Failed to sync taxonomy vocabularies: ${syncError}`);
      // Continue with cached data if available
    }

    // Get updated data
    const updated = await prisma.taxonomyVocabulary.findFirst({
      where: { fieldName },
      include: { terms: true },
    });

    if (!updated) {
      console.warn(`No taxonomy vocabulary found for field: ${fieldName}`);
      return [];
    }

    return termsToOptions(updated.terms, fieldName === 'group_activities');
  } catch (error) {
    console.error(`Error fetching taxonomy options for ${fieldName}:`, error);
    return [];
  }
}

/**
 * Get taxonomy options by vocabulary ID
 */
export async function getTaxonomyOptionsByVocabularyId(
  vocabularyId: string,
): Promise<TaxonomyOption[]> {
  try {
    const vocabulary = await prisma.taxonomyVocabulary.findUnique({
      where: { vocabularyId },
      include: { terms: true },
    });

    if (!vocabulary) {
      return [];
    }

    return vocabulary.terms
      .sort((a: any, b: any) => a.weight - b.weight)
      .map((term: any) => ({
        label: term.name,
        value: term.name,
        limitedRole: term.limitedRole,
      }));
  } catch (error) {
    console.error(
      `Error fetching taxonomy options for vocabulary ${vocabularyId}:`,
      error,
    );
    return [];
  }
}

/**
 * Get taxonomy options that are children of a specific parent term
 */
export async function getChildTaxonomyOptions(
  vocabularyId: string,
  parentTermName: string,
): Promise<TaxonomyOption[]> {
  try {
    const vocabulary = await prisma.taxonomyVocabulary.findUnique({
      where: { vocabularyId },
      include: { terms: true },
    });

    if (!vocabulary) {
      return [];
    }

    // Normalize parent term name for case-insensitive matching
    const normalizedParentName = parentTermName.toLowerCase().trim();

    // Find the parent term using case-insensitive matching
    const parentTerm = vocabulary.terms.find(
      (term: any) => term.name.toLowerCase().trim() === normalizedParentName,
    );

    if (!parentTerm) {
      return [];
    }

    // Get all child terms (terms that have this parent in their parentIds)
    const childTerms = vocabulary.terms.filter((term: any) => {
      const parentIds = JSON.parse(term.parentIds || '[]');
      return parentIds.includes(parentTerm.tid);
    });

    return childTerms
      .sort((a: any, b: any) => a.weight - b.weight)
      .map((term: any) => ({
        label: term.name,
        value: term.name,
        limitedRole: term.limitedRole,
      }));
  } catch (error) {
    console.error(
      `Error fetching child taxonomy options for parent ${parentTermName}:`,
      error,
    );
    return [];
  }
}

/**
 * Get top-level taxonomy options (terms with no parent)
 */
export async function getTopLevelTaxonomyOptions(
  vocabularyId: string,
): Promise<TaxonomyOption[]> {
  try {
    const vocabulary = await prisma.taxonomyVocabulary.findUnique({
      where: { vocabularyId },
      include: { terms: true },
    });

    if (!vocabulary) {
      return [];
    }

    // Get all top-level terms (terms with empty parentIds or parentIds containing only 0)
    const topLevelTerms = vocabulary.terms.filter((term: any) => {
      const parentIds = JSON.parse(term.parentIds || '[]');
      return (
        parentIds.length === 0 || (parentIds.length === 1 && parentIds[0] === 0)
      );
    });

    return termsToOptions(topLevelTerms, vocabularyId === 'group_activities');
  } catch (error) {
    console.error(
      `Error fetching top-level taxonomy options for vocabulary ${vocabularyId}:`,
      error,
    );
    return [];
  }
}

/**
 * Get all taxonomy vocabularies for a specific entity type
 */
export async function getTaxonomyVocabulariesByEntity(
  entityType: 'application' | 'group_member',
) {
  try {
    const vocabularies = await prisma.taxonomyVocabulary.findMany({
      where: { entityType },
      include: { terms: true },
    });

    return vocabularies;
  } catch (error) {
    console.error(
      `Error fetching vocabularies for entity ${entityType}:`,
      error,
    );
    return [];
  }
}

/**
 * Sync taxonomy vocabularies from external API
 */
export async function syncTaxonomyVocabularies() {
  try {
    console.log('Syncing taxonomy vocabularies...');

    const response = await getTaxonomyVocabularies();

    if (!response || !response.data || typeof response.data !== 'object') {
      console.warn('No valid data received from taxonomy API', response);
      return;
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all existing terms first to avoid unique constraint violations
      await tx.taxonomyTerm.deleteMany();

      // Collect all unique terms and their vocabulary mappings
      const uniqueTerms = new Map<
        string,
        { term: any; vocabularyId: string }
      >();
      const vocabularyMap = new Map<string, string>();

      // First pass: Create vocabularies and collect unique terms
      for (const vocab of Object.values(response.data)) {
        // Upsert vocabulary
        const vocabulary = await tx.taxonomyVocabulary.upsert({
          where: { vocabularyId: vocab.vocabulary_id },
          update: {
            vocabularyLabel: vocab.vocabulary_label,
            vocabularyDescription: vocab.vocabulary_description,
            fieldName: vocab.field_name,
            entityType: vocab.entity_type,
            cardinality: vocab.cardinality,
            autoCreate: vocab.auto_create,
            totalTerms: vocab.total_terms,
            lastSyncedAt: new Date(),
          },
          create: {
            vocabularyId: vocab.vocabulary_id,
            vocabularyLabel: vocab.vocabulary_label,
            vocabularyDescription: vocab.vocabulary_description,
            fieldName: vocab.field_name,
            entityType: vocab.entity_type,
            cardinality: vocab.cardinality,
            autoCreate: vocab.auto_create,
            totalTerms: vocab.total_terms,
          },
        });

        vocabularyMap.set(vocab.vocabulary_id, vocabulary.id);

        // Collect unique terms (use first occurrence)
        if (vocab.terms && vocab.terms.length > 0) {
          for (const term of vocab.terms) {
            if (!uniqueTerms.has(term.uuid)) {
              uniqueTerms.set(term.uuid, { term, vocabularyId: vocabulary.id });
            }
          }
        }
      }

      // Second pass: Create all unique terms using upsert for safety
      for (const { term, vocabularyId } of uniqueTerms.values()) {
        // Transform and validate data before inserting - all fields must be valid JSON
        const descriptionContent =
          typeof term.description === 'object'
            ? term.description?.processed ||
              term.description?.value ||
              term.name ||
              'No description available'
            : String(
                term.description || term.name || 'No description available',
              );

        // Ensure description is not empty and convert to JSON string
        const finalDescriptionContent =
          descriptionContent.trim() || term.name || 'No description available';
        const description = JSON.stringify(finalDescriptionContent);

        const parentIds = Array.isArray(term.parent_ids)
          ? JSON.stringify(term.parent_ids)
          : JSON.stringify(term.parent_ids || []);

        const languageContent =
          typeof term.language === 'object'
            ? term.language?.code || 'en' // Default to 'en' if no code
            : String(term.language || 'en'); // Default to 'en' if empty
        const language = JSON.stringify(languageContent);

        try {
          await tx.taxonomyTerm.upsert({
            where: { uuid: term.uuid },
            update: {
              tid: term.tid,
              name: term.name,
              description: description,
              weight: term.weight,
              parentIds: parentIds,
              url: term.url,
              language: language,
              limitedRole: term.limited_role,
              vocabularyId: vocabularyId,
            },
            create: {
              tid: term.tid,
              uuid: term.uuid,
              name: term.name,
              description: description,
              weight: term.weight,
              parentIds: parentIds,
              url: term.url,
              language: language,
              limitedRole: term.limited_role,
              vocabularyId: vocabularyId,
            },
          });
        } catch (termError) {
          console.error(`Failed to upsert term ${term.uuid}:`, {
            termData: { ...term, vocabularyId },
            transformedData: {
              description: finalDescriptionContent,
              parentIds,
              language: languageContent,
              descriptionLength: finalDescriptionContent.length,
              descriptionPreview: finalDescriptionContent.substring(0, 200),
              hasSpecialChars: /[^\x00-\x7F]/.test(finalDescriptionContent),
              encodingInfo: {
                utf8Length: Buffer.from(finalDescriptionContent, 'utf8').length,
                charCodes: finalDescriptionContent
                  .split('')
                  .slice(0, 20)
                  .map((c: string) => c.charCodeAt(0)),
              },
            },
            error: termError,
          });
          throw termError;
        }
      }
    });

    console.log(
      `Successfully synced ${Object.keys(response.data).length} vocabularies`,
    );
  } catch (error) {
    console.error('Error syncing taxonomy vocabularies:', error);
    throw error;
  }
}

/**
 * Get field mapping for application forms
 * Maps form field names to taxonomy vocabulary field names
 */
const taxonomyFieldMapping = {
  // Group data mappings
  purposeOfTheGroup: 'group_background',
  keyActivitiesOfTheGroup: 'group_activities',
  countyOfOperation: 'county',
  constituency: 'constituency',

  // Member data mappings
  natureOfTheGroup: 'group_nature',
  gender: 'gender',
  memberType: 'position', // Maps to position_of_member vocabulary

  // Loan conditions mappings
  loanType: 'loan_type',
  bankName: 'bank_name',

  // Proposed business mappings
  businessType: 'business_type',
  natureOfBusiness: 'business_nature',
};

/**
 * Get term UUID by name for a specific vocabulary field
 * This is used when syncing to external API which expects UUIDs
 */
export async function getTermUuidByName(
  fieldName: string,
  termName: string,
): Promise<string | undefined> {
  try {
    const vocabulary = await prisma.taxonomyVocabulary.findFirst({
      where: { fieldName },
      include: {
        terms: {
          where: { name: termName },
        },
      },
    });

    return vocabulary?.terms[0]?.uuid;
  } catch (error) {
    console.error(
      `Error getting term UUID for ${termName} in field ${fieldName}:`,
      error,
    );
    return undefined;
  }
}

/**
 * Get multiple term UUIDs by names for a specific vocabulary field
 * This is used when syncing to external API which expects UUIDs
 */
export async function getTermUuidsByNames(
  fieldName: string,
  termNames: string[],
): Promise<string[]> {
  try {
    const vocabulary = await prisma.taxonomyVocabulary.findFirst({
      where: { fieldName },
      include: {
        terms: {
          where: { name: { in: termNames } },
        },
      },
    });

    return vocabulary?.terms.map((term) => term.uuid) || [];
  } catch (error) {
    console.error(
      `Error getting term UUIDs for ${termNames} in field ${fieldName}:`,
      error,
    );
    return [];
  }
}

/**
 * Helper to get options for a form field
 */
export async function getFormFieldOptions(
  formFieldName: keyof typeof taxonomyFieldMapping,
): Promise<TaxonomyOption[]> {
  const taxonomyFieldName = taxonomyFieldMapping[formFieldName];

  if (!taxonomyFieldName) {
    console.warn(`No taxonomy mapping found for form field: ${formFieldName}`);
    return [];
  }

  return getTaxonomyOptions(taxonomyFieldName);
}
