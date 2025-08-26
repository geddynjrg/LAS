'use server';

import { getCounties } from '@/lib/api/application/counties';
import { prisma } from '@/lib/db/prisma';

export interface TaxonomyOption {
  label: string;
  value: string;
}

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export interface CountyOption {
  label: string;
  value: string;
}

export interface ConstituencyOption {
  label: string;
  value: string;
  countyId: string;
  countyName: string;
}

/**
 * Get all county options
 */
export async function getCountyOptions(): Promise<CountyOption[]> {
  try {
    // Check cache first
    const cached = await prisma.countiesCache.findFirst({
      orderBy: { lastSyncedAt: 'desc' },
      include: { counties: { include: { constituencies: true } } },
    });

    // Check if cache is still valid
    if (
      cached &&
      Date.now() - cached.lastSyncedAt.getTime() < CACHE_DURATION &&
      cached.counties.length > 0
    ) {
      return cached.counties
        .sort((a: any, b: any) => a.weight - b.weight)
        .map((county: any) => ({
          label: county.name,
          value: county.name,
        }));
    } else {
      try {
        await syncCountiesData();
      } catch (syncError) {
        console.warn(`Failed to sync counties data: ${syncError}`);
        // Continue with cached data if available
      }
    }

    // Get updated data (either from successful sync or cached)
    const updated = await prisma.countiesCache.findFirst({
      orderBy: { lastSyncedAt: 'desc' },
      include: { counties: { include: { constituencies: true } } },
    });

    if (!updated) {
      console.warn('No counties data found');
      return [];
    }

    return updated.counties
      .sort((a: any, b: any) => a.weight - b.weight)
      .map((county: any) => ({
        label: county.name,
        value: county.name,
      }));
  } catch (error) {
    console.error('Error fetching county options:', error);
    return [];
  }
}

/**
 * Get all constituency options
 */
export async function getConstituencyOptions(): Promise<ConstituencyOption[]> {
  try {
    // Check cache first
    const cached = await prisma.countiesCache.findFirst({
      orderBy: { lastSyncedAt: 'desc' },
      include: { counties: { include: { constituencies: true } } },
    });

    // Check if cache is still valid
    if (cached && Date.now() - cached.lastSyncedAt.getTime() < CACHE_DURATION) {
      const constituencies: ConstituencyOption[] = [];

      cached.counties.forEach((county: any) => {
        county.constituencies.forEach((constituency: any) => {
          constituencies.push({
            label: constituency.name,
            value: constituency.name,
            countyId: county.uuid,
            countyName: county.name,
          });
        });
      });

      return constituencies.sort((a, b) => a.label.localeCompare(b.label));
    }

    // Data is stale or missing - try to sync automatically
    if (
      !cached ||
      Date.now() - cached.lastSyncedAt.getTime() >= CACHE_DURATION
    ) {
      try {
        await syncCountiesData();
      } catch (syncError) {
        console.warn(`Failed to sync counties data: ${syncError}`);
        // Continue with cached data if available
      }
    }

    // Get updated data (either from successful sync or cached)
    const updated = await prisma.countiesCache.findFirst({
      orderBy: { lastSyncedAt: 'desc' },
      include: { counties: { include: { constituencies: true } } },
    });

    if (!updated) {
      console.warn('No counties data found');
      return [];
    }

    const constituencies: ConstituencyOption[] = [];

    updated.counties.forEach((county: any) => {
      county.constituencies.forEach((constituency: any) => {
        constituencies.push({
          label: constituency.name,
          value: constituency.name,
          countyId: county.uuid,
          countyName: county.name,
        });
      });
    });

    return constituencies.sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error('Error fetching constituency options:', error);
    return [];
  }
}

/**
 * Get constituencies filtered by county name from all constituency options
 */
export async function getConstituenciesForCountyName(
  countyName: string,
): Promise<TaxonomyOption[]> {
  try {
    const allConstituencies = await getConstituencyOptions();

    // Debug logging
    console.log(`Filtering constituencies for county: "${countyName}"`);
    console.log(`Total constituencies available: ${allConstituencies.length}`);

    // Get unique county names for debugging
    const uniqueCounties = [
      ...new Set(allConstituencies.map((c) => c.countyName)),
    ];
    console.log(`Available counties in data:`, uniqueCounties);

    const filtered = allConstituencies
      .filter((c) => c.countyName === countyName)
      .map((c) => ({ label: c.label, value: c.value }));

    console.log(`Found ${filtered.length} constituencies for "${countyName}"`);

    return filtered;
  } catch (error) {
    console.error(
      `Error filtering constituencies for county ${countyName}:`,
      error,
    );
    return [];
  }
}

/**
 * Get constituencies for a specific county
 */
export async function getConstituenciesForCounty(
  countyName: string,
): Promise<ConstituencyOption[]> {
  try {
    let cached = await prisma.countiesCache.findFirst({
      orderBy: { lastSyncedAt: 'desc' },
      include: {
        counties: {
          where: { name: countyName },
          include: { constituencies: true },
        },
      },
    });

    // If no cached data or data is stale, try to sync automatically
    if (
      !cached ||
      Date.now() - cached.lastSyncedAt.getTime() >= CACHE_DURATION
    ) {
      try {
        await syncCountiesData();
        // Re-fetch after sync
        cached = await prisma.countiesCache.findFirst({
          orderBy: { lastSyncedAt: 'desc' },
          include: {
            counties: {
              where: { name: countyName },
              include: { constituencies: true },
            },
          },
        });
      } catch (syncError) {
        console.warn(`Failed to sync counties data: ${syncError}`);
        // Continue with cached data if available
      }
    }

    if (!cached || cached.counties.length === 0) {
      return [];
    }

    const county = cached.counties[0];
    if (!county) {
      return [];
    }

    return county.constituencies
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .map((constituency: any) => ({
        label: constituency.name,
        value: constituency.name,
        countyId: county.uuid,
        countyName: county.name,
      }));
  } catch (error) {
    console.error(
      `Error fetching constituencies for county ${countyName}:`,
      error,
    );
    return [];
  }
}

/**
 * Sync counties data from external API
 */
export async function syncCountiesData() {
  try {
    console.log('Syncing counties data...');

    const response = await getCounties();

    if (!response || !response.data) {
      console.warn('No valid data received from counties API', response);
      return;
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete existing cache
      await tx.countiesCache.deleteMany();

      // Create new cache entry
      const cacheEntry = await tx.countiesCache.create({
        data: {
          lastSyncedAt: new Date(),
          totalCounties: response.meta.total_counties,
          totalConstituencies: response.meta.total_constituencies,
        },
      });

      // Create counties and constituencies
      for (const county of response.data) {
        const createdCounty = await tx.county.create({
          data: {
            tid: county.tid,
            uuid: county.tid.toString(), // Use tid as uuid since we simplified the response
            name: county.name,
            description: '', // Empty since we removed description from API
            weight: 0, // Default weight since we removed it from API
            url: '', // Empty since we removed URL from API
            language: '{}', // Empty JSON since we removed language from API
            cacheId: cacheEntry.id,
          },
        });

        // Create constituencies for this county
        for (const constituency of county.constituencies) {
          await tx.constituency.create({
            data: {
              tid: constituency.tid,
              uuid: constituency.tid.toString(), // Use tid as uuid since we simplified the response
              name: constituency.name,
              description: '', // Empty since we removed description from API
              weight: 0, // Default weight since we removed it from API
              url: '', // Empty since we removed URL from API
              language: '{}', // Empty JSON since we removed language from API
              countyId: createdCounty.id,
            },
          });
        }
      }
    });

    console.log(
      `Successfully synced ${response.data.length} counties with ${response.meta.total_constituencies} constituencies`,
    );
  } catch (error) {
    console.error('Error syncing counties data:', error);
    throw error;
  }
}
