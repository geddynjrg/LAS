'use client';

import {
  ActionBadge,
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableRow,
  ErrorState,
  LoadingState,
  SearchFilterBar,
  StatCard,
  StatusBadge,
  TablePagination,
} from '@/components/admin';
import type { QueueStatistics } from '@/lib/api/sync.service';
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconClockHour4,
  IconFiles,
  IconLoader,
  IconPlayerPlay,
  IconRefresh,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Label } from '@workspace/ui/components/label';
import { Select } from '@workspace/ui/components/select';
import { useCallback, useEffect, useState } from 'react';

interface QueueItem {
  id: string;
  applicationId: string;
  action: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  scheduledFor: string;
  processedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  application?: {
    user: {
      email: string;
      name?: string;
    };
    groupData?: {
      groupName: string;
    };
  };
}

interface SyncQueueData {
  items: QueueItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

export default function SyncQueuePage() {
  const [queueData, setQueueData] = useState<SyncQueueData | null>(null);
  const [statistics, setStatistics] = useState<QueueStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingItems, setProcessingItems] = useState<Set<string>>(
    new Set(),
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch queue data
  const fetchQueueData = useCallback(async () => {
    try {
      setRefreshing(true);

      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (searchQuery) {
        params.append('applicationId', searchQuery);
      }
      params.append('page', currentPage.toString());
      params.append('pageSize', '20');

      console.log('[SyncQueue] Fetching with params:', params.toString());
      const response = await fetch(`/api/admin/sync-queue?${params}`);

      if (!response.ok) {
        console.error(
          '[SyncQueue] Response not OK:',
          response.status,
          response.statusText,
        );
        const errorText = await response.text();
        console.error('[SyncQueue] Error response:', errorText);

        if (response.status === 401) {
          setError('You need to be logged in as an admin to view this page');
          throw new Error('Unauthorized');
        } else if (response.status === 404) {
          setError(
            'API endpoint not found. Please check the server is running correctly.',
          );
          throw new Error('Not found');
        }

        throw new Error('Failed to fetch queue data');
      }

      const data = await response.json();
      console.log('[SyncQueue] Received data:', data);
      setQueueData(data);
    } catch (error) {
      console.error('Error fetching queue data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, searchQuery, currentPage]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      console.log('[SyncQueue] Fetching statistics...');
      const response = await fetch('/api/admin/sync-queue/stats');

      if (!response.ok) {
        console.error('[SyncQueue] Stats response not OK:', response.status);
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      console.log('[SyncQueue] Statistics data:', data);
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
    fetchStatistics();
  }, [fetchQueueData, fetchStatistics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueueData();
      fetchStatistics();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchQueueData, fetchStatistics]);

  const handleQueueAction = async (
    itemId: string,
    action: 'process' | 'release' | 'retry' | 'cancel',
  ) => {
    setProcessingItems((prev) => new Set(prev).add(itemId));

    try {
      const response = await fetch(
        `/api/admin/sync-queue/${itemId}/${action}`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Action failed');
      }

      // Refresh data
      await fetchQueueData();
      await fetchStatistics();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setProcessingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRetryAll = async () => {
    if (!confirm('Are you sure you want to retry all failed items?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/sync-queue/retry-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry all items');
      }

      const result = await response.json();
      alert(`Successfully queued ${result.count} items for retry`);

      // Refresh data
      await fetchQueueData();
      await fetchStatistics();
    } catch (error) {
      console.error('Error retrying all:', error);
      alert('Failed to retry all items');
    }
  };

  if (loading) {
    return <LoadingState message="Loading sync queue..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Sync Queue Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and manage the application synchronization queue
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Items"
            value={statistics.byStatus.PENDING || 0}
            subtitle="Waiting to process"
            variant={statistics.byStatus.PENDING > 10 ? 'warning' : 'default'}
            icon={<IconClock className="h-4 w-4" />}
          />

          <StatCard
            title="Failed Items"
            value={statistics.byStatus.FAILED || 0}
            subtitle="Need attention"
            variant={statistics.byStatus.FAILED > 0 ? 'danger' : 'success'}
            icon={<IconAlertCircle className="h-4 w-4" />}
          />

          <StatCard
            title="Processing"
            value={statistics.byStatus.PROCESSING || 0}
            subtitle="Currently running"
            variant="info"
            icon={<IconLoader className="h-4 w-4" />}
          />

          <StatCard
            title="Oldest Pending"
            value={
              statistics.oldestPending
                ? (() => {
                    const diffMs =
                      Date.now() - new Date(statistics.oldestPending).getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor(
                      (diffMs % (1000 * 60 * 60)) / (1000 * 60),
                    );
                    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
                    return `${diffMins}m`;
                  })()
                : 'None'
            }
            subtitle="Age of oldest item"
            variant={
              statistics.oldestPending &&
              Date.now() - new Date(statistics.oldestPending).getTime() >
                3600000 // 1 hour
                ? 'warning'
                : 'default'
            }
            icon={<IconClockHour4 className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Filters and Actions */}
      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by Application ID..."
        isSearching={refreshing}
        className="mb-6"
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchQueueData()}
              disabled={refreshing}
              className="h-9"
            >
              <IconRefresh
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              <span className="ml-1.5">Refresh</span>
            </Button>

            {statistics && statistics.byStatus.FAILED > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetryAll}
                className="h-9"
              >
                Retry All Failed
              </Button>
            )}
          </div>
        }
      >
        <div>
          <Label
            htmlFor="status-filter"
            className="text-xs font-medium text-gray-700"
          >
            Filter by Status
          </Label>
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'PROCESSING', label: 'Processing' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'FAILED', label: 'Failed' },
            ]}
            placeholder="Select status"
            className="mt-1 w-full sm:w-40"
          />
        </div>
      </SearchFilterBar>

      {/* Search results info */}
      {searchQuery && queueData && (
        <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Found{' '}
            <span className="font-medium">
              {queueData.pagination.totalCount}
            </span>
            {queueData.pagination.totalCount === 1 ? ' item' : ' items'}
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

      {/* Queue Items Table */}
      <AdminTable>
        <AdminTableHeader>
          <AdminTableHeaderCell>Application ID</AdminTableHeaderCell>
          <AdminTableHeaderCell>User / Group</AdminTableHeaderCell>
          <AdminTableHeaderCell>Action</AdminTableHeaderCell>
          <AdminTableHeaderCell>Status</AdminTableHeaderCell>
          <AdminTableHeaderCell>Attempts</AdminTableHeaderCell>
          <AdminTableHeaderCell>Scheduled</AdminTableHeaderCell>
          <AdminTableHeaderCell>Error</AdminTableHeaderCell>
          <AdminTableHeaderCell className="text-right">
            Actions
          </AdminTableHeaderCell>
        </AdminTableHeader>

        <AdminTableBody>
          {queueData?.items.map((item) => (
            <AdminTableRow key={item.id}>
              <AdminTableCell className="whitespace-nowrap">
                <span className="font-mono text-sm text-gray-900">
                  {item.applicationId}
                </span>
              </AdminTableCell>
              <AdminTableCell>
                <div className="text-sm">
                  <div className="text-gray-900">
                    {item.application?.user.email}
                  </div>
                  {item.application?.groupData?.groupName && (
                    <div className="text-xs text-gray-500">
                      {item.application.groupData.groupName}
                    </div>
                  )}
                </div>
              </AdminTableCell>
              <AdminTableCell className="whitespace-nowrap">
                <ActionBadge action={item.action} />
              </AdminTableCell>
              <AdminTableCell className="whitespace-nowrap">
                <StatusBadge
                  status={item.status}
                  icon={
                    item.status === 'PROCESSING' ? (
                      <IconLoader className="h-3.5 w-3.5" />
                    ) : undefined
                  }
                />
              </AdminTableCell>
              <AdminTableCell className="whitespace-nowrap">
                <span className="text-sm text-gray-600">
                  {item.attempts}/{item.maxAttempts}
                </span>
              </AdminTableCell>
              <AdminTableCell className="whitespace-nowrap">
                <span className="text-sm text-gray-600">
                  {new Date(item.scheduledFor).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </AdminTableCell>
              <AdminTableCell>
                {item.error ? (
                  <div className="group relative max-w-xs">
                    <div className="flex items-start gap-1">
                      <IconAlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                      <span className="line-clamp-1 text-sm text-red-600">
                        {item.error}
                      </span>
                    </div>
                    <div className="absolute left-0 top-full z-50 mt-1 hidden w-80 rounded-md bg-gray-900 p-2 text-xs text-white shadow-lg group-hover:block">
                      {item.error}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </AdminTableCell>
              <AdminTableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={processingItems.has(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      {processingItems.has(item.id) ? (
                        <IconLoader className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {item.status === 'PENDING' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleQueueAction(item.id, 'process')}
                        >
                          <IconPlayerPlay className="mr-2 h-4 w-4" />
                          Process Now
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleQueueAction(item.id, 'cancel')}
                          className="text-red-600"
                        >
                          <IconX className="mr-2 h-4 w-4" />
                          Cancel
                        </DropdownMenuItem>
                      </>
                    )}

                    {item.status === 'PROCESSING' && (
                      <DropdownMenuItem
                        onClick={() => handleQueueAction(item.id, 'release')}
                      >
                        <IconRefresh className="mr-2 h-4 w-4" />
                        Release Lock
                      </DropdownMenuItem>
                    )}

                    {item.status === 'FAILED' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleQueueAction(item.id, 'retry')}
                        >
                          <IconRefresh className="mr-2 h-4 w-4" />
                          Retry
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleQueueAction(item.id, 'cancel')}
                          className="text-red-600"
                        >
                          <IconX className="mr-2 h-4 w-4" />
                          Cancel
                        </DropdownMenuItem>
                      </>
                    )}

                    {item.status === 'COMPLETED' && (
                      <DropdownMenuItem disabled className="text-gray-400">
                        <IconCheck className="mr-2 h-4 w-4" />
                        No actions available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTableBody>
      </AdminTable>

      {queueData && queueData.pagination && (
        <TablePagination
          currentPage={currentPage}
          totalPages={queueData.pagination.totalPages}
          totalCount={queueData.pagination.totalCount}
          pageSize={queueData.pagination.pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {queueData && queueData.items.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          {searchQuery ? (
            <>
              <IconSearch className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No queue items found
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
            </>
          ) : (
            <>
              <IconFiles className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No queue items
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                The sync queue is currently empty
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
