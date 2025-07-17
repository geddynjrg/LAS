import { IconSearch } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@workspace/ui/components/container";
import { Input } from "@workspace/ui/components/input";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { ApplicationsTable } from "./applications-table";
import { TaxonomySyncButton } from "./taxonomy-sync-button";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const t = await getTranslations("AdminDashboard");

  // Get all applications with user info
  const applications = await prisma.application.findMany({
    include: {
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
      createdAt: "desc",
    },
  });

  // Get statistics
  const stats = await prisma.application.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
  });

  const totalApplications = applications.length;
  const statusCounts = stats.reduce(
    (acc, stat) => {
      acc[stat.status] = stat._count._all;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="typo-h1 mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={t("stats.total")}
          value={totalApplications}
          variant="default"
        />
        <StatCard
          title={t("stats.pending")}
          value={statusCounts.PENDING || 0}
          variant="warning"
        />
        <StatCard
          title={t("stats.inReview")}
          value={statusCounts.IN_REVIEW || 0}
          variant="info"
        />
        <StatCard
          title={t("stats.approved")}
          value={statusCounts.APPROVED || 0}
          variant="success"
        />
        <StatCard
          title={t("stats.rejected")}
          value={statusCounts.REJECTED || 0}
          variant="danger"
        />
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm">
          <IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input placeholder={t("searchPlaceholder")} className="pl-9" />
        </div>
        <TaxonomySyncButton />
      </div>

      {/* Applications Table */}
      <ApplicationsTable applications={applications} />
    </Container>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

function StatCard({ title, value, variant = "default" }: StatCardProps) {
  const variantClasses = {
    default: "bg-neutral-100 text-neutral-900",
    success: "bg-green-100 text-green-900",
    warning: "bg-orange-100 text-orange-900",
    danger: "bg-red-100 text-red-900",
    info: "bg-blue-100 text-blue-900",
  };

  return (
    <div className={`rounded-lg p-6 ${variantClasses[variant]}`}>
      <p className="text-sm font-medium opacity-70">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
