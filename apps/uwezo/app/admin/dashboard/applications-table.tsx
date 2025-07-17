"use client";

import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { Currency } from "@workspace/ui/components/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { ApplicationStatus } from "@/components/application-status";
import { syncApplicationAction } from "./actions";

interface Application {
  id: string;
  applicationId: string;
  status: string;
  syncStatus: string;
  createdAt: Date;
  updatedAt: Date;
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
}

type SortField =
  | "applicationId"
  | "user"
  | "groupName"
  | "status"
  | "createdAt";
type SortOrder = "asc" | "desc";

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const t = useTranslations("AdminDashboard");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSync = async (applicationId: string) => {
    setSyncingIds((prev) => new Set(prev).add(applicationId));
    try {
      await syncApplicationAction(applicationId);
      // Refresh the page to show updated sync status
      window.location.reload();
    } catch (error) {
      console.error("Failed to sync application:", error);
    } finally {
      setSyncingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer"
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
            <TableRow key={application.id}>
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
                <ApplicationStatus status={application.status as any} />
              </TableCell>
              <TableCell>
                <SyncStatusBadge status={application.syncStatus} />
              </TableCell>
              <TableCell>
                {new Date(application.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/${application.applicationId}`}>
                      <IconEye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {application.syncStatus !== "COMPLETED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSync(application.applicationId)}
                      disabled={syncingIds.has(application.applicationId)}
                    >
                      <IconRefresh
                        className={`h-4 w-4 ${
                          syncingIds.has(application.applicationId)
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SyncStatusBadge({ status }: { status: string }) {
  const classes = {
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        classes[status as keyof typeof classes] || classes.PENDING
      }`}
    >
      {status}
    </span>
  );
}
