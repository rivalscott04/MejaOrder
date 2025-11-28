"use client";

import { useState, useEffect } from "react";
import { Package, Menu, Users, AlertCircle, Loader2 } from "lucide-react";
import { fetchUsageStats, type UsageStats } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function UsageStatsCard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchUsageStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load usage stats:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat statistik");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-5 w-5 bg-slate-200 animate-pulse rounded" />
          <div className="h-5 w-32 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-200 animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-slate-200 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error || !stats || !stats.has_subscription) {
    return null; // Don't show if no subscription
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-rose-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getUsageTextColor = (percentage: number) => {
    if (percentage >= 90) return "text-rose-700";
    if (percentage >= 75) return "text-amber-700";
    return "text-emerald-700";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <Package className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Penggunaan Paket</h3>
            <p className="text-xs text-slate-500">{stats.plan_name}</p>
          </div>
        </div>
        <Link
          href="/tenant-admin/subscription"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
        >
          Lihat Detail
        </Link>
      </div>

      <div className="space-y-4">
        {/* Menu Usage */}
        {stats.menus && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Menu className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Menu</span>
              </div>
              <span className={cn("text-sm font-semibold", getUsageTextColor(stats.menus.percentage))}>
                {stats.menus.current} / {stats.menus.is_unlimited ? "∞" : stats.menus.max}
              </span>
            </div>
            {!stats.menus.is_unlimited && (
              <>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full transition-all", getUsageColor(stats.menus.percentage))}
                    style={{ width: `${Math.min(100, stats.menus.percentage)}%` }}
                  />
                </div>
                {stats.menus.percentage >= 75 && (
                  <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {stats.menus.percentage >= 90
                      ? "Limit hampir tercapai! Pertimbangkan untuk upgrade paket."
                      : "Penggunaan sudah tinggi. Pertimbangkan untuk upgrade paket."}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* User Usage */}
        {stats.users && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">User</span>
              </div>
              <span className={cn("text-sm font-semibold", getUsageTextColor(stats.users.percentage))}>
                {stats.users.current} / {stats.users.is_unlimited ? "∞" : stats.users.max}
              </span>
            </div>
            {!stats.users.is_unlimited && (
              <>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full transition-all", getUsageColor(stats.users.percentage))}
                    style={{ width: `${Math.min(100, stats.users.percentage)}%` }}
                  />
                </div>
                {stats.users.percentage >= 75 && (
                  <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {stats.users.percentage >= 90
                      ? "Limit hampir tercapai! Pertimbangkan untuk upgrade paket."
                      : "Penggunaan sudah tinggi. Pertimbangkan untuk upgrade paket."}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}











