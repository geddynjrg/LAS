"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Currency } from "@workspace/ui/components/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { syncApplicationAction } from "./actions";

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
    email: string;
    name: string | null;
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
  searchQuery?: string;
  loading?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

type SortField =
  | "applicationId"
  | "user"
  | "groupName"
  | "status"
  | "createdAt";
type SortOrder = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export function ApplicationsTable({
  applications: initialApplications,
  searchQuery = "",
  loading = false,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
}: ApplicationsTableProps) {
  const t = useTranslations("AdminDashboard");
  const [applications, setApplications] = useState(initialApplications);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncMessage, setSyncMessage] = useState<{
    applicationId: string;
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Update applications when props change
  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSync = useCallback(async (applicationId: string) => {
    setSyncingIds((prev) => new Set(prev).add(applicationId));
    setSyncMessage(null);

    try {
      const result = await syncApplicationAction(applicationId);

      if (result.success && "application" in result && result.application) {
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
          type: "success",
          message: "Application synced successfully",
        });
      } else {
        const errorMessage =
          "error" in result ? result.error : "Failed to sync application";
        setSyncMessage({
          applicationId,
          type: "error",
          message: errorMessage || "Failed to sync application",
        });
      }
    } catch (error) {
      console.error("Failed to sync application:", error);
      setSyncMessage({
        applicationId,
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to sync application",
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
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "applicationId":
        aValue = a.applicationId;
        bValue = b.applicationId;
        break;
      case "user":
        aValue = a.user.name || a.user.email;
        bValue = b.user.name || b.user.email;
        break;
      case "groupName":
        aValue = a.groupData?.groupName || "";
        bValue = b.groupData?.groupName || "";
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "createdAt":
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <IconChevronUp className="h-4 w-4" />
    ) : (
      <IconChevronDown className="h-4 w-4" />
    );
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(
    currentPage * ITEMS_PER_PAGE,
    startIndex + applications.length - 1,
  );

  return (
    <div className="space-y-4">
      {syncMessage && (
        <div
          className={`rounded-lg border p-4 ${syncMessage.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <div className="flex items-center gap-2">
            {syncMessage.type === "success" ? (
              <IconCheck className="h-5 w-5 text-green-600" />
            ) : (
              <IconAlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p
              className={`text-sm font-medium ${syncMessage.type === "success" ? "text-green-800" : "text-red-800"}`}
            >
              {syncMessage.message}
            </p>
          </div>
        </div>
      )}

      <div className="animate-in fade-in relative overflow-hidden rounded-xl border bg-white shadow-sm duration-200">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              <span className="text-sm text-gray-600">Searching...</span>
            </div>
          </div>
        )}
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-gray-200">
              <TableHead
                className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900"
                onClick={() => handleSort("applicationId")}
              >
                <div className="flex items-center gap-1">
                  {t("table.applicationId")}
                  <SortIcon field="applicationId" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("user")}
              >
                <div className="flex items-center gap-1">
                  {t("table.user")}
                  <SortIcon field="user" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("groupName")}
              >
                <div className="flex items-center gap-1">
                  {t("table.groupName")}
                  <SortIcon field="groupName" />
                </div>
              </TableHead>
              <TableHead>{t("table.loanAmount")}</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  {t("table.status")}
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead>{t("table.syncStatus")}</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-1">
                  {t("table.createdAt")}
                  <SortIcon field="createdAt" />
                </div>
              </TableHead>
              <TableHead>{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedApplications.map((application) => (
              <TableRow
                key={application.id}
                className="transition-colors hover:bg-gray-50"
              >
                <TableCell className="font-medium">
                  {application.applicationId}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {application.user.name || application.user.email}
                    </p>
                    {application.user.name && (
                      <p className="text-muted-foreground text-sm">
                        {application.user.email}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{application.groupData?.groupName || "-"}</TableCell>
                <TableCell>
                  {application.loanConditions ? (
                    <Currency
                      amount={application.loanConditions.loanAmount}
                      currency="KES"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <ApplicationStatusBadge status={application.status} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <SyncStatusBadge status={application.syncStatus} />
                    {application.externalId && (
                      <span className="text-xs text-gray-500">
                        ID: {application.externalId}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(application.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="hover:bg-gray-100"
                    >
                      <Link href={`/dashboard/${application.applicationId}`}>
                        <IconEye className="h-4 w-4 text-gray-600" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSync(application.applicationId)}
                      disabled={syncingIds.has(application.applicationId)}
                      className="hover:bg-gray-100"
                    >
                      <IconRefresh
                        className={`h-4 w-4 text-gray-600 ${
                          syncingIds.has(application.applicationId)
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {applications.length > 0 ? startIndex : 0}
              </span>{" "}
              to <span className="font-medium">{endIndex}</span> of{" "}
              <span className="font-medium">{totalCount}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <IconChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {/* Add ellipsis if there's a gap */}
                      {index > 0 && array[index - 1]! < page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={page === currentPage ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onPageChange?.(page)}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  onPageChange?.(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    UNSUBMITTED: {
      label: "Not Started",
      color: "bg-gray-100 text-gray-700 border-gray-200",
    },
    DRAFT: {
      label: "Draft",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    SUBMITTED: {
      label: "Submitted",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    PENDING: {
      label: "Pending",
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    IN_REVIEW: {
      label: "In Review",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    APPROVED: {
      label: "Approved",
      color: "bg-green-50 text-green-700 border-green-200",
    },
    REJECTED: {
      label: "Rejected",
      color: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] ||
    statusConfig.UNSUBMITTED;

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function SyncStatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PENDING: "secondary",
    IN_PROGRESS: "default",
    COMPLETED: "default", // Using default for success since success variant doesn't exist
    FAILED: "destructive",
  };

  const labels = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Synced",
    FAILED: "Failed",
  };

  const customClasses = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-green-50 text-green-700 border-green-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        customClasses[status as keyof typeof customClasses] ||
        customClasses.PENDING
      }`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
