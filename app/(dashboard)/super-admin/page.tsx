"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { superAdminPlans, superAdminTenants } from "@/lib/mock-data";
import { cn, currencyFormatter } from "@/lib/utils";
import { Building2, Package, Users, TrendingUp, Search, Plus, Edit, ShieldCheck } from "lucide-react";
import { StatsGridSkeleton, TableSkeleton, PlanGridSkeleton } from "@/components/shared/menu-skeleton";

export default function SuperAdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "trial">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const filteredTenants = superAdminTenants.filter((tenant) => {
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    totalTenants: superAdminTenants.length,
    active: superAdminTenants.filter((t) => t.status === "active").length,
    expired: superAdminTenants.filter((t) => t.status === "expired").length,
    totalPlans: superAdminPlans.length,
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout role="super-admin" userEmail="admin@orderops.com" userName="Super Admin">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Kontrol Tenant, Plan, dan Subscription</h1>
        <p className="mt-2 text-sm text-slate-600">
          Kelola semua tenant, subscription plan, dan monitor aktivitas platform
        </p>
      </div>

      {/* Stats Overview */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <div className="mb-6 lg:mb-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Tenant" value={stats.totalTenants} icon={<Building2 className="h-5 w-5" />} />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            label="Expired"
            value={stats.expired}
            icon={<ShieldCheck className="h-5 w-5" />}
            variant="warning"
          />
          <StatCard label="Plan Tersedia" value={stats.totalPlans} icon={<Package className="h-5 w-5" />} />
        </div>
      )}

      {/* Tenant List */}
      <div className="mb-6 lg:mb-8 rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
        <div className="mb-4 lg:mb-6 flex flex-col gap-3 lg:gap-4 md:flex-row md:items-center md:justify-between">
          <SectionTitle icon={<Users className="h-4 w-4" />} title="Daftar Tenant" />
          <div className="flex flex-wrap gap-2 lg:gap-3">
            <div className="relative flex-1 min-w-[150px] lg:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "active", "expired", "trial"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold capitalize transition",
                    statusFilter === status
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <div className="overflow-x-auto -mx-4 lg:mx-0">
            <div className="inline-block min-w-full align-middle px-4 lg:px-0">
              <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3">Nama Tenant</th>
                  <th className="pb-3">Slug</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Expiry</th>
                  <th className="pb-3">Orders Today</th>
                  <th className="pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50">
                    <td className="py-4 font-semibold text-slate-900">{tenant.name}</td>
                    <td className="py-4 text-slate-600">{tenant.slug}</td>
                    <td className="py-4 text-slate-600">{tenant.plan}</td>
                    <td className="py-4">
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="py-4 text-slate-600">{tenant.expiry}</td>
                    <td className="py-4 font-semibold text-slate-900">{tenant.ordersToday}</td>
                    <td className="py-4">
                      <button
                        onClick={() => setSelectedTenantId(tenant.id)}
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Plans Management */}
      <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
        <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SectionTitle icon={<Package className="h-4 w-4" />} title="Subscription Plans" />
          <button className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Tambah Plan
          </button>
        </div>
        {isLoading ? (
          <PlanGridSkeleton count={3} />
        ) : (
          <div className="grid gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {superAdminPlans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {currencyFormatter.format(plan.price)}
                  <span className="text-sm font-normal text-slate-600">/bulan</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  <Edit className="mr-2 inline h-4 w-4" />
                  Edit Plan
                </button>
              </div>
            ))}
          </div>
        )}
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
        <div className={cn(iconColors[variant], "scale-90 lg:scale-100")}>{icon}</div>
      </div>
      <p className={`text-2xl lg:text-3xl font-bold ${textColors[variant]}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    expired: "bg-amber-100 text-amber-700",
    trial: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", variants[status] ?? "bg-slate-100 text-slate-700")}>
      {status}
    </span>
  );
}

