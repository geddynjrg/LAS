'use client';

import { LoadingState, SearchFilterBar, StatCard } from '@/components/admin';
import {
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconEye,
  IconFiles,
  IconSearch,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { getApplicationsData } from './actions';
import { ApplicationsTable } from './applications-table';
import { DataSyncButton } from './data-sync-button';

interface Application {
  id: string;
  applicationId: string;
  status: string;
  syncStatus: string;
  createdAt: Date;
  updatedAt: Date;
  externalId?: string | null;
  lastSyncAt?: Date | null;
  user: {
    email?: string | null;
    name?: string | null;
  };
  groupData: {
    groupName: string;
  } | null;
  loanConditions: {
    loanAmount: number;
  } | null;
}

interface Stats {
  totalApplications: number;
  statusCounts: Record<string, number>;
}

export default function AdminDashboardPage() {
  const t = useTranslations('AdminDashboard');
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    statusCounts: {},
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pageSize = 10;

  // Load initial data
  useEffect(() => {
    loadData('', 1);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on new search
      loadData(searchQuery, 1);
    }, 300); // 300ms debounce delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  async function loadData(query: string, page: number) {
    try {
      // setSearching(true);
      const data = await getApplicationsData(query, page, pageSize);
      setApplications(data.applications);
      setStats(data.stats);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadData(searchQuery, page);
  };

  // Add keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="text"]',
        ) as HTMLInputElement;
        searchInput?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return <LoadingState message="Loading applications..." />;
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-2 text-gray-600">{t('description')}</p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={t('stats.total')}
          value={stats.totalApplications}
          variant="default"
          icon={<IconFiles className="h-4 w-4" />}
        />
        <StatCard
          title={t('stats.pending')}
          value={stats.statusCounts.PENDING || 0}
          variant="warning"
          icon={<IconClock className="h-4 w-4" />}
        />
        <StatCard
          title={t('stats.inReview')}
          value={stats.statusCounts.IN_REVIEW || 0}
          variant="info"
          icon={<IconEye className="h-4 w-4" />}
        />
        <StatCard
          title={t('stats.approved')}
          value={stats.statusCounts.APPROVED || 0}
          variant="success"
          icon={<IconCircleCheck className="h-4 w-4" />}
        />
        <StatCard
          title={t('stats.rejected')}
          value={stats.statusCounts.REJECTED || 0}
          variant="danger"
          icon={<IconCircleX className="h-4 w-4" />}
        />
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <SearchFilterBar
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setSearching(true);
          }}
          searchPlaceholder={t('searchPlaceholder')}
          isSearching={searching}
          actions={
            <div className="flex gap-2">
              <DataSyncButton />
            </div>
          }
        />

        {/* Search results info */}
        {searchQuery && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Found <span className="font-medium">{totalCount}</span>
              {totalCount === 1 ? ' application' : ' applications'}
              {searchQuery && (
                <>
                  {' '}
                  matching &ldquo;
                  <span className="font-medium">{searchQuery}</span>&rdquo;
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Applications Table */}
      {applications.length === 0 && searchQuery && !searching ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <IconSearch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No applications found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search terms or clearing the search
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Clear search
          </button>
        </div>
      ) : (
        <ApplicationsTable
          applications={applications}
          loading={searching}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
