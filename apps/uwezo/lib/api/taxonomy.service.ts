"use server";

import { getTaxonomyVocabularies } from "@/lib/api/application/taxonomy-vocabularies";
import { prisma } from "@/lib/db/prisma";

// import type { TaxonomyVocabulary, TaxonomyTerm } from "@/lib/api/schema/application/taxonomy-vocabularies.schema";

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export interface TaxonomyOption {
  label: string;
  value: string;
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
      return cached.terms
        .sort((a: any, b: any) => a.weight - b.weight)
        .map((term: any) => ({
          label: term.name,
          value: term.uuid,
        }));
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

    return updated.terms
      .sort((a: any, b: any) => a.weight - b.weight)
      .map((term: any) => ({
        label: term.name,
        value: term.uuid,
      }));
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
        value: term.uuid,
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
 * Get all taxonomy vocabularies for a specific entity type
 */
export async function getTaxonomyVocabulariesByEntity(
  entityType: "application" | "group_member",
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
    console.log("Syncing taxonomy vocabularies...");

    const response = await getTaxonomyVocabularies();

    if (!response || !response.data || typeof response.data !== "object") {
      console.warn("No valid data received from taxonomy API", response);
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
        await tx.taxonomyTerm.upsert({
          where: { uuid: term.uuid },
          update: {
            tid: term.tid,
            name: term.name,
            description: term.description,
            weight: term.weight,
            parentIds: term.parent_ids,
            url: term.url,
            language: term.language,
            vocabularyId: vocabularyId,
          },
          create: {
            tid: term.tid,
            uuid: term.uuid,
            name: term.name,
            description: term.description,
            weight: term.weight,
            parentIds: term.parent_ids,
            url: term.url,
            language: term.language,
            vocabularyId: vocabularyId,
          },
        });
      }
    });

    console.log(
      `Successfully synced ${Object.keys(response.data).length} vocabularies`,
    );
  } catch (error) {
    console.error("Error syncing taxonomy vocabularies:", error);
    throw error;
  }
}

/**
 * Get field mapping for application forms
 * Maps form field names to taxonomy vocabulary field names
 */
const taxonomyFieldMapping = {
  // Group data mappings
  purposeOfTheGroup: "group_background",
  keyActivitiesOfTheGroup: "group_activities",
  valueChain: "value_chain",
  countyOfOperation: "county",
  constituency: "constituency",

  // Member data mappings
  natureOfTheGroup: "group_nature",
  gender: "gender",
  memberType: "member_position",

  // Loan conditions mappings
  purposeOfLoan: "purpose_of_loan",
  loanType: "loan_type",
  bankName: "bank_name",

  // Proposed business mappings
  businessType: "business_type",
  natureOfBusiness: "business_nature",
};

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
