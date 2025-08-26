import { syncTaxonomyVocabularies } from '../lib/api/taxonomy.service';

async function main() {
  console.log('Starting seed process...');

  try {
    // Sync taxonomy vocabularies
    console.log('Syncing taxonomy vocabularies...');
    await syncTaxonomyVocabularies();
    console.log('✅ Taxonomy vocabularies synced successfully');

    // Add more seed operations here as needed
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Prisma client cleanup is handled automatically
    process.exit(0);
  });
