'use server';

import { getCounties } from '@/lib/api/application/counties';
import { prisma } from '@/lib/db/prisma';

export interface TaxonomyOption {
  label: string;
  value: string;
}

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

let syncInFlight: Promise<void> | null = null;

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
    const trimmed = countyName.trim();
    if (!trimmed) {
      return [];
    }

    // Prefer the direct county query (avoids loading all 290 constituencies).
    const direct = await getConstituenciesForCounty(trimmed);
    if (direct.length > 0) {
      return direct.map((c) => ({ label: c.label, value: c.value }));
    }

    // Case-insensitive fallback for slight naming mismatches.
    const allConstituencies = await getConstituencyOptions();
    const needle = trimmed.toLowerCase();
    return allConstituencies
      .filter((c) => c.countyName.trim().toLowerCase() === needle)
      .map((c) => ({ label: c.label, value: c.value }));
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
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    try {
      console.log('Syncing counties data...');

      const response = await getCounties();

      if (!response || !response.data) {
        console.warn('No valid data received from counties API', response);
        return;
      }

      // Create the new cache first, then delete older rows so readers never
      // observe an empty counties table mid-sync.
      await prisma.$transaction(async (tx) => {
        const cacheEntry = await tx.countiesCache.create({
          data: {
            lastSyncedAt: new Date(),
            totalCounties: response.meta.total_counties,
            totalConstituencies: response.meta.total_constituencies,
          },
        });

        for (const county of response.data) {
          const createdCounty = await tx.county.create({
            data: {
              tid: county.tid,
              uuid: county.tid.toString(),
              name: county.name,
              description: '',
              weight: 0,
              url: '',
              language: '{}',
              cacheId: cacheEntry.id,
            },
          });

          for (const constituency of county.constituencies) {
            await tx.constituency.create({
              data: {
                tid: constituency.tid,
                uuid: constituency.tid.toString(),
                name: constituency.name,
                description: '',
                weight: 0,
                url: '',
                language: '{}',
                countyId: createdCounty.id,
              },
            });
          }
        }

        await tx.countiesCache.deleteMany({
          where: { id: { not: cacheEntry.id } },
        });
      });

      console.log(
        `Successfully synced ${response.data.length} counties with ${response.meta.total_constituencies} constituencies`,
      );
    } catch (error) {
      console.error('Error syncing counties data:', error);
      throw error;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}
