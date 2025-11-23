"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { tenantContext, subscriptionCard } from "@/lib/mock-data";
import { cn, currencyFormatter } from "@/lib/utils";
import {
  LayoutDashboard,
  QrCode,
  TrendingUp,
  Clock,
  Plus,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { StatsGridSkeleton } from "@/components/shared/menu-skeleton";

export default function TenantAdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const todayStats = {
    orders: 24,
    revenue: 1250000,
    pendingPayments: 3,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout role="tenant-admin" userEmail="admin@brewhaven.id" userName="Admin BrewHaven">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{tenantContext.name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Kelola menu, meja, pengguna, dan monitor aktivitas operasional
          </p>
        </div>

        {/* Content */}
        <OverviewTab stats={todayStats} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}

function OverviewTab({ stats, isLoading }: { stats: { orders: number; revenue: number; pendingPayments: number }; isLoading: boolean }) {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Today Stats */}
      {isLoading ? (
        <StatsGridSkeleton count={3} />
      ) : (
        <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-3">
          <StatCard
            label="Pesanan Hari Ini"
            value={stats.orders.toString()}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            label="Pendapatan Hari Ini"
            value={currencyFormatter.format(stats.revenue)}
            icon={<BarChart3 className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            label="Pembayaran Pending"
            value={stats.pendingPayments.toString()}
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
        <SectionTitle icon={<LayoutDashboard className="h-4 w-4" />} title="Quick Actions" />
        <div className="mt-3 lg:mt-4 grid gap-2 lg:gap-3 grid-cols-1 sm:grid-cols-3">
          <Link
            href="/tenant-admin/menu"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Tambah Menu
          </Link>
          <Link
            href="/tenant-admin/tables"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <QrCode className="h-4 w-4" />
            Generate QR Meja
          </Link>
          <Link
            href="/tenant-admin/reports"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <BarChart3 className="h-4 w-4" />
            Lihat Laporan
          </Link>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
        <SectionTitle icon={<ShieldCheck className="h-4 w-4" />} title="Subscription" />
        <div className="mt-4 rounded-2xl bg-slate-50 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Plan</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{subscriptionCard.plan}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">{subscriptionCard.status}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Berlaku Hingga</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{subscriptionCard.expiresAt}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">
              Perpanjang
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Hubungi Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: string;
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
      <p className={`text-xl lg:text-2xl font-bold ${textColors[variant]}`}>{value}</p>
    </div>
  );
}
