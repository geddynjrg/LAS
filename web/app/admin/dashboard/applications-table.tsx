'use client';

import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableRow,
  StatusBadge,
  TableLoadingOverlay,
  TablePagination,
} from '@/components/admin';
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconRefresh,
} from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
import { Currency } from '@workspace/ui/components/currency';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { syncApplicationAction } from './actions';

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

interface ApplicationsTableProps {
  applications: Application[];
  loading?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

type SortField =
  | 'applicationId'
  | 'user'
  | 'groupName'
  | 'status'
  | 'createdAt';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export function ApplicationsTable({
  applications: initialApplications,
  loading = false,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
}: ApplicationsTableProps) {
  const t = useTranslations('AdminDashboard');
  const [applications, setApplications] = useState(initialApplications);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncMessage, setSyncMessage] = useState<{
    applicationId: string;
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Update applications when props change
  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSync = useCallback(async (applicationId: string) => {
    setSyncingIds((prev) => new Set(prev).add(applicationId));
    setSyncMessage(null);

    try {
      const result = await syncApplicationAction(applicationId);

      if (result.success && 'application' in result && result.application) {
        // Update the application in the local state
        const updatedApp = result.application;
        setApplications((prev) =>
          prev.map((app) =>
            app.applicationId === applicationId
              ? {
                  ...app,
                  syncStatus: updatedApp.syncStatus,
                  externalId: updatedApp.externalId,
                  lastSyncAt: updatedApp.lastSyncAt,
                }
              : app,
          ),
        );

        setSyncMessage({
          applicationId,
          type: 'success',
          message: 'Application synced successfully',
        });
      } else {
        const errorMessage =
          'error' in result ? result.error : 'Failed to sync application';
        setSyncMessage({
          applicationId,
          type: 'error',
          message: errorMessage || 'Failed to sync application',
        });
      }
    } catch (error) {
      console.error('Failed to sync application:', error);
      setSyncMessage({
        applicationId,
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to sync application',
      });
    } finally {
      setSyncingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });

      // Clear message after 5 seconds
      setTimeout(() => {
        setSyncMessage((prev) =>
          prev?.applicationId === applicationId ? null : prev,
        );
      }, 5000);
    }
  }, []);

  // Sort applications locally (only the current page)
  const sortedApplications = [...applications].sort((a, b) => {
    let aValue: string | Date | null | undefined;
    let bValue: string | Date | null | undefined;

    switch (sortField) {
      case 'applicationId':
        aValue = a.applicationId;
        bValue = b.applicationId;
        break;
      case 'user':
        aValue = a.user.name || a.user.email;
        bValue = b.user.name || b.user.email;
        break;
      case 'groupName':
        aValue = a.groupData?.groupName || '';
        bValue = b.groupData?.groupName || '';
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'createdAt':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
    }

    // Handle null/undefined values for comparison
    const normalizedA = aValue ?? '';
    const normalizedB = bValue ?? '';

    if (normalizedA < normalizedB) return sortOrder === 'asc' ? -1 : 1;
    if (normalizedA > normalizedB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <IconChevronUp className="h-4 w-4" />
    ) : (
      <IconChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="space-y-4">
      {syncMessage && (
        <div
          className={`rounded-lg border p-4 ${syncMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
        >
          <div className="flex items-center gap-2">
            {syncMessage.type === 'success' ? (
              <IconCheck className="h-5 w-5 text-green-600" />
            ) : (
              <IconAlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p
              className={`text-sm font-medium ${syncMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}
            >
              {syncMessage.message}
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <TableLoadingOverlay isLoading={loading} message="Searching..." />

        <AdminTable>
          <AdminTableHeader>
            <AdminTableHeaderCell
              sortable
              onClick={() => handleSort('applicationId')}
            >
              <div className="flex items-center gap-1">
                {t('table.applicationId')}
                <SortIcon field="applicationId" />
              </div>
            </AdminTableHeaderCell>
            <AdminTableHeaderCell sortable onClick={() => handleSort('user')}>
              <div className="flex items-center gap-1">
                {t('table.user')}
                <SortIcon field="user" />
              </div>
            </AdminTableHeaderCell>
            <AdminTableHeaderCell
              sortable
              onClick={() => handleSort('groupName')}
            >
              <div className="flex items-center gap-1">
                {t('table.groupName')}
                <SortIcon field="groupName" />
              </div>
            </AdminTableHeaderCell>
            <AdminTableHeaderCell>{t('table.loanAmount')}</AdminTableHeaderCell>
            <AdminTableHeaderCell sortable onClick={() => handleSort('status')}>
              <div className="flex items-center gap-1">
                {t('table.status')}
                <SortIcon field="status" />
              </div>
            </AdminTableHeaderCell>
            <AdminTableHeaderCell>{t('table.syncStatus')}</AdminTableHeaderCell>
            <AdminTableHeaderCell
              sortable
              onClick={() => handleSort('createdAt')}
            >
              <div className="flex items-center gap-1">
                {t('table.createdAt')}
                <SortIcon field="createdAt" />
              </div>
            </AdminTableHeaderCell>
            <AdminTableHeaderCell>{t('table.actions')}</AdminTableHeaderCell>
          </AdminTableHeader>

          <AdminTableBody>
            {sortedApplications.map((application) => (
              <AdminTableRow key={application.id}>
                <AdminTableCell className="font-mono text-sm font-medium">
                  {application.applicationId}
                </AdminTableCell>
                <AdminTableCell>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {application.user.name || application.user.email}
                    </p>
                    {application.user.name && (
                      <p className="text-xs text-gray-500">
                        {application.user.email}
                      </p>
                    )}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-sm text-gray-900">
                    {application.groupData?.groupName || '—'}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  {application.loanConditions ? (
                    <Currency
                      amount={application.loanConditions.loanAmount}
                      currency="KES"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </AdminTableCell>
                <AdminTableCell>
                  <StatusBadge status={application.status} />
                </AdminTableCell>
                <AdminTableCell>
                  <div className="space-y-1">
                    <StatusBadge status={application.syncStatus} />
                    {application.externalId && (
                      <p className="text-xs text-gray-500">
                        ID: {application.externalId}
                      </p>
                    )}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-sm text-gray-600">
                    {new Date(application.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      },
                    )}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <Link href={`/dashboard/${application.applicationId}`}>
                        <IconEye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSync(application.applicationId)}
                      disabled={syncingIds.has(application.applicationId)}
                      className="h-8 w-8 p-0"
                    >
                      <IconRefresh
                        className={`h-4 w-4 ${
                          syncingIds.has(application.applicationId)
                            ? 'animate-spin'
                            : ''
                        }`}
                      />
                    </Button>
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </AdminTable>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={onPageChange || (() => {})}
          showPageNumbers={true}
        />
      </div>
    </div>
  );
}
