'use server';

import { syncCountiesData } from '@/lib/api/counties.service';
import { syncApplication as syncApplicationService } from '@/lib/api/sync.service';
import { syncTaxonomyVocabularies } from '@/lib/api/taxonomy.service';
import { requireAdmin } from '@/lib/auth/guards';
import { getHybridApplications } from '@/lib/data/applications-hybrid';
import { prisma } from '@/lib/db/prisma';

export async function syncApplicationAction(applicationId: string) {
  // Ensure user is admin
  await requireAdmin();

  try {
    const result = await syncApplicationService(applicationId, true);

    if (result.success) {
      // Fetch the updated application data
      const updatedApplication = await prisma.application.findUnique({
        where: { applicationId },
        select: {
          id: true,
          applicationId: true,
          status: true,
          syncStatus: true,
          externalId: true,
          lastSyncAt: true,
        },
      });

      return {
        success: true,
        application: updatedApplication,
        message: result.message,
      };
    }

    return result;
  } catch (error) {
    console.error('Error syncing application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function syncTaxonomyAction() {
  // Ensure user is admin
  await requireAdmin();

  try {
    // Sync both taxonomy vocabularies and counties/constituencies
    await Promise.all([syncTaxonomyVocabularies(), syncCountiesData()]);

    return {
      success: true,
      message: 'Taxonomy vocabularies and counties synced successfully',
    };
  } catch (error) {
    console.error('Error syncing taxonomy data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function syncCountiesAction() {
  // Ensure user is admin
  await requireAdmin();

  try {
    await syncCountiesData();
    return {
      success: true,
      message: 'Counties and constituencies synced successfully',
    };
  } catch (error) {
    console.error('Error syncing counties data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getApplicationsData(
  searchQuery = '',
  page = 1,
  pageSize = 10,
) {
  await requireAdmin();

  // First, fetch from hybrid approach to sync latest status from Drupal
  // This updates the local database with current status from API
  try {
    await getHybridApplications();
  } catch (error) {
    console.warn('Failed to sync from Drupal, using local data only:', error);
  }

  // Build search conditions
  // Note: MySQL doesn't support mode: "insensitive", but contains is case-insensitive by default in MySQL
  const searchConditions = searchQuery
    ? {
        OR: [
          {
            applicationId: {
              contains: searchQuery,
            },
          },
          {
            user: {
              email: {
                contains: searchQuery,
              },
            },
          },
          {
            user: {
              name: {
                contains: searchQuery,
              },
            },
          },
          {
            groupData: {
              groupName: {
                contains: searchQuery,
              },
            },
          },
        ],
      }
    : {};

  // Get total count for pagination
  const totalCount = await prisma.application.count({
    where: searchConditions,
  });

  // Get applications with search filter and pagination
  const applications = await prisma.application.findMany({
    where: searchConditions,
    select: {
      id: true,
      applicationId: true,
      status: true,
      syncStatus: true,
      externalId: true,
      lastSyncAt: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      groupData: {
        select: {
          groupName: true,
        },
      },
      loanConditions: {
        select: {
          loanAmount: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Get statistics (for all applications, not filtered)
  const stats = await prisma.application.groupBy({
    by: ['status'],
    _count: {
      _all: true,
    },
  });

  const totalApplications = await prisma.application.count();
  const statusCounts = stats.reduce(
    (acc, stat) => {
      acc[stat.status] = stat._count._all;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    applications,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / pageSize),
    stats: {
      totalApplications,
      statusCounts,
    },
  };
}
