"use server";

import { syncApplication as syncApplicationService } from "@/lib/api/sync.service";
import { syncTaxonomyVocabularies } from "@/lib/api/taxonomy.service";
import { requireAdmin } from "@/lib/auth/guards";

export async function syncApplicationAction(applicationId: string) {
  // Ensure user is admin
  await requireAdmin();

  try {
    const result = await syncApplicationService(applicationId);
    return result;
  } catch (error) {
    console.error("Error syncing application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function syncTaxonomyAction() {
  // Ensure user is admin
  await requireAdmin();

  try {
    await syncTaxonomyVocabularies();
    return {
      success: true,
      message: "Taxonomy vocabularies synced successfully",
    };
  } catch (error) {
    console.error("Error syncing taxonomy vocabularies:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
