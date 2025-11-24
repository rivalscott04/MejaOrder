"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { fetchSuperAdminTenants, cancelTenantSubscription, type SuperAdminTenant } from "@/lib/api-client";
import { Users, Calendar, Package, X, Loader2 } from "lucide-react";
import { StatsGridSkeleton, TableSkeleton } from "@/components/shared/menu-skeleton";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Toast } from "@/components/shared/toast";

export default function SubscriptionsPage() {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "trial">("all");
  const [cancelTarget, setCancelTarget] = useState<{ tenantId: number; subscriptionId: number; tenantName: string } | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const tenantsRes = await fetchSuperAdminTenants();
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allSubscriptions = tenants.flatMap((tenant) =>
    (tenant.subscriptions || []).map((sub) => ({
      ...sub,
      tenant,
    }))
  );

  const filteredSubscriptions = allSubscriptions.filter((sub) => {
    if (statusFilter === "all") return true;
    return sub.status === statusFilter;
  });

  const stats = {
    total: allSubscriptions.length,
    active: allSubscriptions.filter((s) => s.status === "active").length,
    expired: allSubscriptions.filter((s) => s.status === "expired").length,
    trial: allSubscriptions.filter((s) => s.status === "trial").length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      expired: "bg-rose-100 text-rose-700",
      trial: "bg-blue-100 text-blue-700",
      canceled: "bg-slate-100 text-slate-700",
    };
    return (
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold capitalize",
          variants[status] ?? "bg-slate-100 text-slate-700"
        )}
      >
        {status}
      </span>
    );
  };

  const handleCancelSubscription = async () => {
    if (!cancelTarget) return;

    try {
      setIsCanceling(true);
      await cancelTenantSubscription(cancelTarget.tenantId, cancelTarget.subscriptionId);
      setToast({ 
        message: `Subscription untuk ${cancelTarget.tenantName} berhasil dibatalkan`, 
        variant: "success" 
      });
      setCancelTarget(null);
      await loadData();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      setToast({ 
        message: error instanceof Error ? error.message : "Gagal membatalkan subscription", 
        variant: "error" 
      });
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <DashboardLayout role="super-admin" userEmail="admin@orderops.com" userName="Super Admin">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Kelola Langganan</h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor dan kelola semua langganan aktif dari tenant. Lihat tenant mana yang sudah berlangganan ke paket tertentu beserta status dan tanggalnya.
          </p>
        </div>

        {/* Stats Overview */}
        {isLoading ? (
          <StatsGridSkeleton count={4} />
        ) : (
          <div className="mb-6 lg:mb-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Langganan" value={stats.total} icon={<Package className="h-5 w-5" />} />
            <StatCard
              label="Active"
              value={stats.active}
              icon={<Users className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              label="Expired"
              value={stats.expired}
              icon={<Calendar className="h-5 w-5" />}
              variant="warning"
            />
            <StatCard
              label="Trial"
              value={stats.trial}
              icon={<Package className="h-5 w-5" />}
              variant="default"
            />
          </div>
        )}

        {/* Subscriptions List */}
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
          <div className="mb-4 lg:mb-6 flex flex-col gap-3 lg:gap-4 md:flex-row md:items-center md:justify-between">
            <SectionTitle icon={<Package className="h-4 w-4" />} title="Daftar Langganan" />
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

          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : (
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <div className="inline-block min-w-full align-middle px-4 lg:px-0">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="pb-3">Tenant</th>
                      <th className="pb-3">Paket</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Tanggal Mulai</th>
                      <th className="pb-3">Tanggal Berakhir</th>
                      <th className="pb-3">Harga</th>
                      <th className="pb-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          Tidak ada langganan ditemukan
                        </td>
                      </tr>
                    ) : (
                      filteredSubscriptions.map((sub) => {
                        const canCancel = sub.status === "active" || sub.status === "trial";
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="py-4 font-semibold text-slate-900">{sub.tenant.name}</td>
                            <td className="py-4 text-slate-600">{sub.plan?.name || "-"}</td>
                            <td className="py-4">{getStatusBadge(sub.status)}</td>
                            <td className="py-4 text-slate-600">
                              {new Date(sub.start_date).toLocaleDateString("id-ID")}
                            </td>
                            <td className="py-4 text-slate-600">
                              {new Date(sub.end_date).toLocaleDateString("id-ID")}
                            </td>
                            <td className="py-4 text-slate-600">
                              {sub.plan?.price_monthly
                                ? `Rp ${parseFloat(sub.plan.price_monthly).toLocaleString("id-ID")}/bulan`
                                : "-"}
                            </td>
                            <td className="py-4">
                              {canCancel ? (
                                <button
                                  onClick={() => setCancelTarget({ 
                                    tenantId: sub.tenant.id, 
                                    subscriptionId: sub.id,
                                    tenantName: sub.tenant.name 
                                  })}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Batalkan
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          isOpen={!!toast}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelSubscription}
        title="Batalkan Subscription"
        message={cancelTarget ? `Apakah Anda yakin ingin membatalkan subscription untuk tenant "${cancelTarget.tenantName}"? Setelah dibatalkan, tenant tidak akan dapat menggunakan fitur premium hingga subscription diaktifkan kembali.` : ""}
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tidak"
        variant="danger"
        isLoading={isCanceling}
      />
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

