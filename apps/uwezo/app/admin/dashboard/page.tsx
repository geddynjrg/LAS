"use client";

import {
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconEye,
  IconFiles,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Container } from "@workspace/ui/components/container";

import { getApplicationsData } from "./actions";
import { ApplicationsTable } from "./applications-table";
import { TaxonomySyncButton } from "./taxonomy-sync-button";

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

interface Stats {
  totalApplications: number;
  statusCounts: Record<string, number>;
}

export default function AdminDashboardPage() {
  const t = useTranslations("AdminDashboard");
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    statusCounts: {},
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pageSize = 10;

  // Load initial data
  useEffect(() => {
    loadData("", 1);
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
      setSearching(true);
      const data = await getApplicationsData(query, page, pageSize);
      setApplications(data.applications);
      setStats(data.stats);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Failed to load applications:", error);
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
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="text"]',
        ) as HTMLInputElement;
        searchInput?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading && !searching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-2 text-gray-600">{t("description")}</p>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title={t("stats.total")}
            value={stats.totalApplications}
            variant="default"
            icon={<IconFiles className="h-5 w-5 text-gray-700" />}
          />
          <StatCard
            title={t("stats.pending")}
            value={stats.statusCounts.PENDING || 0}
            variant="warning"
            icon={<IconClock className="h-5 w-5 text-amber-700" />}
          />
          <StatCard
            title={t("stats.inReview")}
            value={stats.statusCounts.IN_REVIEW || 0}
            variant="info"
            icon={<IconEye className="h-5 w-5 text-blue-700" />}
          />
          <StatCard
            title={t("stats.approved")}
            value={stats.statusCounts.APPROVED || 0}
            variant="success"
            icon={<IconCircleCheck className="h-5 w-5 text-green-700" />}
          />
          <StatCard
            title={t("stats.rejected")}
            value={stats.statusCounts.REJECTED || 0}
            variant="danger"
            icon={<IconCircleX className="h-5 w-5 text-red-700" />}
          />
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className={`h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 text-sm placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  searchQuery ? "pr-10" : "pr-16"
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <IconX className="h-4 w-4" />
                </button>
              ) : (
                <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-xs text-gray-400 lg:flex">
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                    ⌘K
                  </kbd>
                </div>
              )}
            </div>
            <TaxonomySyncButton />
          </div>

          {/* Search results info */}
          {searchQuery && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Found <span className="font-medium">{totalCount}</span>
                {totalCount === 1 ? " application" : " applications"}
                {searchQuery && (
                  <>
                    {" "}
                    matching "<span className="font-medium">{searchQuery}</span>
                    "
                  </>
                )}
              </div>
              {searching && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                  <span className="text-xs">Searching...</span>
                </div>
              )}
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
              onClick={() => setSearchQuery("")}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Clear search
            </button>
          </div>
        ) : (
          <ApplicationsTable
            applications={applications}
            searchQuery={searchQuery}
            loading={searching}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
          />
        )}
      </Container>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  icon?: React.ReactNode;
}

function StatCard({ title, value, variant = "default", icon }: StatCardProps) {
  const backgroundClasses = {
    default: "bg-gradient-to-br from-gray-50 to-gray-100/50",
    success: "bg-gradient-to-br from-green-50 to-green-100/50",
    warning: "bg-gradient-to-br from-amber-50 to-amber-100/50",
    danger: "bg-gradient-to-br from-red-50 to-red-100/50",
    info: "bg-gradient-to-br from-blue-50 to-blue-100/50",
  };

  const iconBgClasses = {
    default: "bg-white/80 shadow-sm",
    success: "bg-white/80 shadow-sm",
    warning: "bg-white/80 shadow-sm",
    danger: "bg-white/80 shadow-sm",
    info: "bg-white/80 shadow-sm",
  };

  const textClasses = {
    default: "text-gray-900",
    success: "text-green-900",
    warning: "text-amber-900",
    danger: "text-red-900",
    info: "text-blue-900",
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${backgroundClasses[variant]}`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p
              className={`mt-3 text-4xl font-bold tracking-tight transition-colors ${textClasses[variant]}`}
            >
              {value.toLocaleString()}
            </p>
          </div>
          {icon && (
            <div
              className={`rounded-xl p-2.5 transition-transform group-hover:scale-110 ${iconBgClasses[variant]}`}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
      {/* Decorative elements with animation */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 transition-transform group-hover:scale-110" />
      <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-white/10 transition-transform group-hover:scale-110" />
    </div>
  );
}
