"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { TenantFormModal } from "@/components/super-admin/tenant-form-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Toast } from "@/components/shared/toast";
import {
  fetchSuperAdminTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  toggleTenantStatus,
  type SuperAdminTenant,
  type CreateTenantPayload,
  type UpdateTenantPayload,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Building2, Search, Plus, Edit, Trash2, ShieldCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { StatsGridSkeleton, TableSkeleton } from "@/components/shared/menu-skeleton";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Tenant modal states
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<SuperAdminTenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<SuperAdminTenant | null>(null);
  
  // Loading states
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);
  const [isTogglingTenant, setIsTogglingTenant] = useState<number | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const tenantsRes = await fetchSuperAdminTenants();
      setTenants(tenantsRes.data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memuat data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && tenant.is_active) ||
      (statusFilter === "inactive" && !tenant.is_active);
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    totalTenants: tenants.length,
    active: tenants.filter((t) => t.is_active).length,
    inactive: tenants.filter((t) => !t.is_active).length,
  };

  // Tenant handlers
  const handleCreateTenant = () => {
    setSelectedTenant(null);
    setIsTenantModalOpen(true);
  };

  const handleEditTenant = (tenant: SuperAdminTenant) => {
    setSelectedTenant(tenant);
    setIsTenantModalOpen(true);
  };

  const handleDeleteTenant = (tenant: SuperAdminTenant) => {
    setTenantToDelete(tenant);
  };

  const handleTenantSubmit = async (payload: CreateTenantPayload | UpdateTenantPayload) => {
    try {
      if (selectedTenant) {
        await updateTenant(selectedTenant.id, payload);
        showToast("Tenant berhasil diupdate", "success");
      } else {
        await createTenant(payload as CreateTenantPayload);
        showToast("Tenant berhasil dibuat", "success");
      }
      await loadData();
      setIsTenantModalOpen(false);
      setSelectedTenant(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan tenant", "error");
      throw error;
    }
  };

  const handleConfirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    setIsDeletingTenant(true);
    try {
      await deleteTenant(tenantToDelete.id);
      showToast("Tenant berhasil dihapus", "success");
      await loadData();
      setTenantToDelete(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menghapus tenant", "error");
    } finally {
      setIsDeletingTenant(false);
    }
  };

  const handleToggleTenantStatus = async (tenant: SuperAdminTenant) => {
    setIsTogglingTenant(tenant.id);
    try {
      await toggleTenantStatus(tenant.id);
      showToast(`Tenant ${tenant.is_active ? "dinonaktifkan" : "diaktifkan"}`, "success");
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal mengubah status tenant", "error");
    } finally {
      setIsTogglingTenant(null);
    }
  };

  const getTenantPlan = (tenant: SuperAdminTenant) => {
    const activeSubscription = tenant.subscriptions?.find((s) => s.status === "active");
    return activeSubscription?.plan?.name || "-";
  };

  const getTenantExpiry = (tenant: SuperAdminTenant) => {
    const activeSubscription = tenant.subscriptions?.find((s) => s.status === "active");
    if (!activeSubscription) return "-";
    return new Date(activeSubscription.end_date).toLocaleDateString("id-ID");
  };

  return (
    <DashboardLayout role="super-admin" userEmail="admin@orderops.com" userName="Super Admin">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Kelola Tenants</h1>
          <p className="mt-2 text-sm text-slate-600">
            Kelola semua tenant yang terdaftar di platform
          </p>
        </div>

        {/* Stats Overview */}
        {isLoading ? (
          <StatsGridSkeleton count={3} />
        ) : (
          <div className="mb-6 lg:mb-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <StatCard label="Total Tenant" value={stats.totalTenants} icon={<Building2 className="h-5 w-5" />} />
            <StatCard
              label="Active"
              value={stats.active}
              icon={<ShieldCheck className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              label="Inactive"
              value={stats.inactive}
              icon={<ShieldCheck className="h-5 w-5" />}
              variant="warning"
            />
          </div>
        )}

        {/* Tenant List */}
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
          <div className="mb-4 lg:mb-6 flex flex-col gap-3 lg:gap-4 md:flex-row md:items-center md:justify-between">
            <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Daftar Tenant" />
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
                {(["all", "active", "inactive"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-semibold capitalize transition-all duration-200 cursor-pointer",
                      statusFilter === status
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105 active:scale-95"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCreateTenant}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-600 hover:scale-105 hover:shadow-md hover:shadow-emerald-500/30 active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Tambah Tenant
              </button>
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
                      <th className="pb-3">Nama Tenant</th>
                      <th className="pb-3">Slug</th>
                      <th className="pb-3">Plan</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Expiry</th>
                      <th className="pb-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Tidak ada tenant ditemukan
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-slate-50">
                          <td className="py-4 font-semibold text-slate-900">{tenant.name}</td>
                          <td className="py-4 text-slate-600">{tenant.slug}</td>
                          <td className="py-4 text-slate-600">{getTenantPlan(tenant)}</td>
                          <td className="py-4">
                            <StatusBadge status={tenant.is_active ? "active" : "inactive"} />
                          </td>
                          <td className="py-4 text-slate-600">{getTenantExpiry(tenant)}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditTenant(tenant)}
                                className="group relative flex items-center justify-center rounded-lg p-2 text-emerald-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-110 active:scale-95 cursor-pointer"
                                title="Edit Tenant"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleTenantStatus(tenant)}
                                disabled={isTogglingTenant === tenant.id}
                                className="group relative flex items-center justify-center rounded-lg p-2 text-amber-600 transition-all duration-200 hover:bg-amber-50 hover:text-amber-700 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent cursor-pointer"
                                title={tenant.is_active ? "Nonaktifkan" : "Aktifkan"}
                              >
                                {isTogglingTenant === tenant.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ShieldCheck className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteTenant(tenant)}
                                className="group relative flex items-center justify-center rounded-lg p-2 text-rose-600 transition-all duration-200 hover:bg-rose-50 hover:text-rose-700 hover:scale-110 active:scale-95 cursor-pointer"
                                title="Hapus Tenant"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TenantFormModal
        isOpen={isTenantModalOpen}
        onClose={() => {
          setIsTenantModalOpen(false);
          setSelectedTenant(null);
        }}
        onSubmit={handleTenantSubmit}
        tenant={selectedTenant}
      />

      <ConfirmModal
        isOpen={!!tenantToDelete}
        onClose={() => {
          if (!isDeletingTenant) {
            setTenantToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteTenant}
        title="Hapus Tenant"
        message={`Apakah Anda yakin ingin menghapus tenant "${tenantToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={isDeletingTenant}
      />

      {toast && (
        <Toast
          isOpen={!!toast}
          message={toast.message}
          variant={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
  const variants: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    active: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    inactive: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-200",
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  
  const variant = variants[status] ?? variants.inactive;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize shadow-sm",
      variant.bg,
      variant.text,
      variant.border
    )}>
      {variant.icon}
      {status}
    </span>
  );
}

