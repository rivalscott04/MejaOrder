"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { fetchSuperAdminTenants, fetchPlans, type SuperAdminTenant, type Plan } from "@/lib/api-client";
import { Building2, Package, Users, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { StatsGridSkeleton } from "@/components/shared/menu-skeleton";

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tenantsRes, plansRes] = await Promise.all([
        fetchSuperAdminTenants(),
        fetchPlans(),
      ]);
      setTenants(tenantsRes.data);
      setPlans(plansRes.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
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
    totalPlans: plans.length,
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ringkasan platform dan akses cepat ke fitur utama
          </p>
        </div>

        {/* Stats Overview */}
        {isLoading ? (
          <StatsGridSkeleton count={4} />
        ) : (
          <div className="mb-6 lg:mb-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Tenant"
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
              label="Total Paket"
              value={stats.totalPlans}
              icon={<Package className="h-5 w-5" />}
            />
            <StatCard
              label="Langganan Aktif"
              value={stats.activeSubscriptions}
              icon={<Users className="h-5 w-5" />}
              variant="success"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Kelola Tenants"
            description="Lihat dan kelola semua tenant yang terdaftar"
            href="/super-admin/tenants"
            icon={<Building2 className="h-6 w-6" />}
            color="emerald"
          />
          <QuickActionCard
            title="Kelola Plans"
            description="Buat dan edit subscription plans"
            href="/super-admin/plans"
            icon={<Package className="h-6 w-6" />}
            color="blue"
          />
          <QuickActionCard
            title="Subscriptions"
            description="Monitor semua subscriptions"
            href="/super-admin/subscriptions"
            icon={<Users className="h-6 w-6" />}
            color="purple"
          />
          <QuickActionCard
            title="Laporan"
            description="Lihat statistik dan laporan platform"
            href="/super-admin/reports"
            icon={<TrendingUp className="h-6 w-6" />}
            color="amber"
          />
          <QuickActionCard
            title="Pengaturan"
            description="Kelola pengaturan platform"
            href="/super-admin/settings"
            icon={<Building2 className="h-6 w-6" />}
            color="slate"
          />
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

function QuickActionCard({
  title,
  description,
  href,
  icon,
  color,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "purple" | "amber" | "slate";
}) {
  const colorClasses = {
    emerald: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700",
    blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700",
    purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700",
    amber: "bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700",
    slate: "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700",
  };

  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-6 transition ${colorClasses[color]}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-lg bg-white/50 p-2">{icon}</div>
        <ArrowRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </Link>
  );
}
