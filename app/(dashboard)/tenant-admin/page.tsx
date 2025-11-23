"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
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
import { fetchOrders, fetchTenantSettings, getCurrentUser, type LoginResponse } from "@/lib/api-client";

type TodayStats = {
  orders: number;
  revenue: number;
  pendingPayments: number;
};

type SubscriptionInfo = {
  plan: string;
  status: string;
  expiresAt: string;
};

export default function TenantAdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    orders: 0,
    revenue: 0,
    pendingPayments: 0,
  });
  const [tenantName, setTenantName] = useState<string>("");
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    plan: "-",
    status: "-",
    expiresAt: "-",
  });
  const [userData, setUserData] = useState<LoginResponse | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
      
      // Fetch today's orders
      const ordersResponse = await fetchOrders({ date: today, all: true });
      const todayOrders = ordersResponse.data;
      
      // Calculate stats
      const orders = todayOrders.length;
      const revenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || "0"), 0);
      const pendingPayments = todayOrders.filter(
        (order) => order.payment_status === "waiting_verification" || order.payment_status === "unpaid"
      ).length;
      
      setTodayStats({ orders, revenue, pendingPayments });
      
      // Fetch tenant settings and user data
      const [settings, user] = await Promise.all([
        fetchTenantSettings().catch(() => null),
        getCurrentUser().catch(() => null),
      ]);
      
      if (settings) {
        setTenantName(settings.name);
        
        // Get subscription info from settings
        if (settings.subscription) {
          setSubscriptionInfo({
            plan: settings.subscription.plan,
            status: settings.subscription.status,
            expiresAt: settings.subscription.expires_at,
          });
        } else {
          setSubscriptionInfo({
            plan: "-",
            status: "Tidak ada",
            expiresAt: "-",
          });
        }
      }
      
      if (user) {
        setUserData(user);
        if (user.tenant && !settings) {
          setTenantName(user.tenant.name);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const displayName = userData?.user.name || "Admin";
  const displayEmail = userData?.user.email || "";

  return (
    <DashboardLayout role="tenant-admin" userEmail={displayEmail} userName={displayName}>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            {tenantName || "Loading..."}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Kelola menu, meja, pengguna, dan monitor aktivitas operasional
          </p>
        </div>

        {/* Content */}
        <OverviewTab stats={todayStats} isLoading={isLoading} subscriptionInfo={subscriptionInfo} />
      </div>
    </DashboardLayout>
  );
}

function OverviewTab({ 
  stats, 
  isLoading, 
  subscriptionInfo 
}: { 
  stats: TodayStats; 
  isLoading: boolean;
  subscriptionInfo: SubscriptionInfo;
}) {
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
              <p className="mt-1 text-lg font-semibold text-slate-900">{subscriptionInfo.plan}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">{subscriptionInfo.status}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Berlaku Hingga</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{subscriptionInfo.expiresAt}</p>
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
