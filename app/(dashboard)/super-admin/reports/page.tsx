"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { fetchSuperAdminTenants, type SuperAdminTenant } from "@/lib/api-client";
import { BarChart3, TrendingUp, Building2, Package } from "lucide-react";
import { StatsGridSkeleton } from "@/components/shared/menu-skeleton";

export default function ReportsPage() {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const tenantsRes = await fetchSuperAdminTenants();
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((t) => t.is_active).length,
    totalSubscriptions: tenants.reduce((acc, t) => acc + (t.subscriptions?.length || 0), 0),
    activeSubscriptions: tenants.reduce(
      (acc, t) => acc + (t.subscriptions?.filter((s) => s.status === "active").length || 0),
      0
    ),
  };

  return (
    <DashboardLayout role="super-admin" userEmail="admin@orderops.com" userName="Super Admin">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Laporan Platform</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ringkasan statistik dan aktivitas platform
          </p>
        </div>

        {/* Stats Overview */}
        {isLoading ? (
          <StatsGridSkeleton count={4} />
        ) : (
          <div className="mb-6 lg:mb-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Tenants"
              value={stats.totalTenants}
              icon={<Building2 className="h-5 w-5" />}
            />
            <StatCard
              label="Active Tenants"
              value={stats.activeTenants}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              label="Total Subscriptions"
              value={stats.totalSubscriptions}
              icon={<Package className="h-5 w-5" />}
            />
            <StatCard
              label="Active Subscriptions"
              value={stats.activeSubscriptions}
              icon={<BarChart3 className="h-5 w-5" />}
              variant="success"
            />
          </div>
        )}

        {/* Reports Content */}
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
          <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Ringkasan Platform" />
          <div className="mt-4 text-sm text-slate-600">
            <p>Fitur laporan detail akan segera hadir.</p>
            <p className="mt-2">
              Di sini akan menampilkan grafik revenue, aktivitas tenant, dan statistik lainnya.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning";
}) {
  const bgColors = {
    default: "bg-white border-slate-200",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
  };
  const textColors = {
    default: "text-slate-900",
    success: "text-emerald-700",
    warning: "text-amber-700",
  };
  const iconColors = {
    default: "text-slate-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
  };

  return (
    <div className={`rounded-xl lg:rounded-2xl border p-4 lg:p-6 ${bgColors[variant]}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <div className={`${iconColors[variant]} scale-90 lg:scale-100`}>{icon}</div>
      </div>
      <p className={`text-2xl lg:text-3xl font-bold ${textColors[variant]}`}>{value}</p>
    </div>
  );
}

