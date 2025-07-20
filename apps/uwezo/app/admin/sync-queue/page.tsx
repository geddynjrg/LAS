"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconClockHour4,
  IconFiles,
  IconHeartbeat,
  IconLoader,
  IconPercentage,
  IconPlayerPlay,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select } from "@workspace/ui/components/select";

import type { QueueStatistics } from "@/lib/api/sync.service";

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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch queue data
  const fetchQueueData = useCallback(async () => {
    try {
      setRefreshing(true);

      const params = new URLSearchParams();
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }
      if (searchQuery) {
        params.append("applicationId", searchQuery);
      }
      params.append("page", currentPage.toString());
      params.append("pageSize", "20");

      console.log("[SyncQueue] Fetching with params:", params.toString());
      const response = await fetch(`/api/admin/sync-queue?${params}`);

      if (!response.ok) {
        console.error(
          "[SyncQueue] Response not OK:",
          response.status,
          response.statusText,
        );
        const errorText = await response.text();
        console.error("[SyncQueue] Error response:", errorText);

        if (response.status === 401) {
          setError("You need to be logged in as an admin to view this page");
          throw new Error("Unauthorized");
        } else if (response.status === 404) {
          setError(
            "API endpoint not found. Please check the server is running correctly.",
          );
          throw new Error("Not found");
        }

        throw new Error("Failed to fetch queue data");
      }

      const data = await response.json();
      console.log("[SyncQueue] Received data:", data);
      setQueueData(data);
    } catch (error) {
      console.error("Error fetching queue data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, searchQuery, currentPage]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      console.log("[SyncQueue] Fetching statistics...");
      const response = await fetch("/api/admin/sync-queue/stats");

      if (!response.ok) {
        console.error("[SyncQueue] Stats response not OK:", response.status);
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      console.log("[SyncQueue] Statistics data:", data);
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
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
    action: "process" | "release" | "retry" | "cancel",
  ) => {
    setProcessingItems((prev) => new Set(prev).add(itemId));

    try {
      const response = await fetch(
        `/api/admin/sync-queue/${itemId}/${action}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Action failed");
      }

      // Refresh data
      await fetchQueueData();
      await fetchStatistics();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(error instanceof Error ? error.message : "Action failed");
    } finally {
      setProcessingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRetryAll = async () => {
    if (!confirm("Are you sure you want to retry all failed items?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/sync-queue/retry-all", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to retry all items");
      }

      const result = await response.json();
      alert(`Successfully queued ${result.count} items for retry`);

      // Refresh data
      await fetchQueueData();
      await fetchStatistics();
    } catch (error) {
      console.error("Error retrying all:", error);
      alert("Failed to retry all items");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { classes: string; icon: any; label: string }
    > = {
      PENDING: {
        classes: "bg-amber-50 text-amber-700 border-amber-200",
        icon: IconClock,
        label: "Pending",
      },
      PROCESSING: {
        classes: "bg-blue-50 text-blue-700 border-blue-200",
        icon: IconLoader,
        label: "Processing",
      },
      COMPLETED: {
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: IconCheck,
        label: "Completed",
      },
      FAILED: {
        classes: "bg-red-50 text-red-700 border-red-200",
        icon: IconX,
        label: "Failed",
      },
    };

    const statusConfig = config[status] || {
      classes: "bg-gray-50 text-gray-700 border-gray-200",
      icon: IconClock,
      label: status,
    };
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.classes}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {statusConfig.label}
      </span>
    );
  };

  const getActionBadge = (action: string) => {
    const config: Record<string, { classes: string; label: string }> = {
      CREATE: {
        classes: "bg-indigo-50 text-indigo-700 border-indigo-200",
        label: "Create",
      },
      UPDATE: {
        classes: "bg-purple-50 text-purple-700 border-purple-200",
        label: "Update",
      },
      DELETE: {
        classes: "bg-red-50 text-red-700 border-red-200",
        label: "Delete",
      },
    };

    const actionConfig = config[action] || {
      classes: "bg-gray-50 text-gray-700 border-gray-200",
      label: action,
    };

    return (
      <span
        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${actionConfig.classes}`}
      >
        {actionConfig.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <IconLoader className="mx-auto h-10 w-10 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Loading sync queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <IconAlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-lg font-semibold text-red-800">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-6">
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
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Items
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {statistics.total}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-100 p-2">
                  <IconFiles className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Success Rate
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {statistics.successRate.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg bg-green-100 p-2">
                  <IconPercentage className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Avg Time
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {statistics.averageProcessingTime < 60
                      ? `${statistics.averageProcessingTime.toFixed(1)}s`
                      : `${(statistics.averageProcessingTime / 60).toFixed(1)}m`}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-100 p-2">
                  <IconClockHour4 className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Queue Health
                </p>
                <div className="space-y-1">
                  {statistics.byStatus.PENDING > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600">Pending</span>
                      <span className="font-medium">
                        {statistics.byStatus.PENDING}
                      </span>
                    </div>
                  )}
                  {statistics.byStatus.PROCESSING > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600">Processing</span>
                      <span className="font-medium">
                        {statistics.byStatus.PROCESSING}
                      </span>
                    </div>
                  )}
                  {statistics.byStatus.FAILED > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-600">Failed</span>
                      <span className="font-medium">
                        {statistics.byStatus.FAILED}
                      </span>
                    </div>
                  )}
                  {statistics.byStatus.COMPLETED > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600">Completed</span>
                      <span className="font-medium">
                        {statistics.byStatus.COMPLETED}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
                    { value: "all", label: "All Statuses" },
                    { value: "PENDING", label: "Pending" },
                    { value: "PROCESSING", label: "Processing" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "FAILED", label: "Failed" },
                  ]}
                  placeholder="Select status"
                  className="mt-1 w-full sm:w-40"
                />
              </div>

              <div className="flex-1 sm:max-w-xs">
                <Label
                  htmlFor="search"
                  className="text-xs font-medium text-gray-700"
                >
                  Search Application
                </Label>
                <div className="relative mt-1">
                  <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchQueueData()}
                disabled={refreshing}
                className="h-9"
              >
                <IconRefresh
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
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
          </div>
        </div>

        {/* Queue Items Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Application ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User / Group
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Attempts
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Scheduled
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Error
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {queueData?.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-mono text-sm text-gray-900">
                        {item.applicationId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {getActionBadge(item.action)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {item.attempts}/{item.maxAttempts}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {new Date(item.scheduledFor).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 text-right">
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

                          {item.status === "PENDING" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQueueAction(item.id, "process")
                                }
                              >
                                <IconPlayerPlay className="mr-2 h-4 w-4" />
                                Process Now
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQueueAction(item.id, "cancel")
                                }
                                className="text-red-600"
                              >
                                <IconX className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}

                          {item.status === "PROCESSING" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleQueueAction(item.id, "release")
                              }
                            >
                              <IconRefresh className="mr-2 h-4 w-4" />
                              Release Lock
                            </DropdownMenuItem>
                          )}

                          {item.status === "FAILED" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQueueAction(item.id, "retry")
                                }
                              >
                                <IconRefresh className="mr-2 h-4 w-4" />
                                Retry
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleQueueAction(item.id, "cancel")
                                }
                                className="text-red-600"
                              >
                                <IconX className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}

                          {item.status === "COMPLETED" && (
                            <DropdownMenuItem
                              disabled
                              className="text-gray-400"
                            >
                              <IconCheck className="mr-2 h-4 w-4" />
                              No actions available
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {queueData && queueData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(queueData.pagination.totalPages, p + 1),
                    )
                  }
                  disabled={currentPage === queueData.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * queueData.pagination.pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * queueData.pagination.pageSize,
                        queueData.pagination.totalCount,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {queueData.pagination.totalCount}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(queueData.pagination.totalPages, p + 1),
                      )
                    }
                    disabled={currentPage === queueData.pagination.totalPages}
                    className="h-8"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}

          {queueData && queueData.items.length === 0 && (
            <div className="py-12 text-center">
              <IconFiles className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No queue items found</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
