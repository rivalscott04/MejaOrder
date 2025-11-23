"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { TenantFormModal } from "@/components/super-admin/tenant-form-modal";
import { PlanFormModal } from "@/components/super-admin/plan-form-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Toast } from "@/components/shared/toast";
import {
  fetchSuperAdminTenants,
  fetchPlans,
  createTenant,
  updateTenant,
  deleteTenant,
  toggleTenantStatus,
  createPlan,
  updatePlan,
  deletePlan,
  type SuperAdminTenant,
  type Plan,
  type CreateTenantPayload,
  type UpdateTenantPayload,
  type CreatePlanPayload,
  type UpdatePlanPayload,
} from "@/lib/api-client";
import { cn, currencyFormatter } from "@/lib/utils";
import { Building2, Package, Users, TrendingUp, Search, Plus, Edit, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { StatsGridSkeleton, TableSkeleton, PlanGridSkeleton } from "@/components/shared/menu-skeleton";

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Tenant modal states
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<SuperAdminTenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<SuperAdminTenant | null>(null);
  
  // Plan modal states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  
  // Loading states
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [isTogglingTenant, setIsTogglingTenant] = useState<number | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
    totalPlans: plans.length,
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

  // Plan handlers
  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setIsPlanModalOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsPlanModalOpen(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setPlanToDelete(plan);
  };

  const handlePlanSubmit = async (payload: CreatePlanPayload | UpdatePlanPayload) => {
    try {
      if (selectedPlan) {
        await updatePlan(selectedPlan.id, payload);
        showToast("Plan berhasil diupdate", "success");
      } else {
        await createPlan(payload as CreatePlanPayload);
        showToast("Plan berhasil dibuat", "success");
      }
      await loadData();
      setIsPlanModalOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan plan", "error");
      throw error;
    }
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeletingPlan(true);
    try {
      await deletePlan(planToDelete.id);
      showToast("Plan berhasil dihapus", "success");
      await loadData();
      setPlanToDelete(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menghapus plan", "error");
    } finally {
      setIsDeletingPlan(false);
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

  const calculatePlanPrice = (plan: Plan) => {
    let price = parseFloat(plan.price_monthly);
    if (plan.discount_percentage) {
      price = price * (1 - parseFloat(plan.discount_percentage) / 100);
    }
    if (plan.discount_amount) {
      price = price - parseFloat(plan.discount_amount);
    }
    return Math.max(0, price);
  };

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
              label="Inactive"
              value={stats.inactive}
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
                {(["all", "active", "inactive"] as const).map((status) => (
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
              <button
                onClick={handleCreateTenant}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" />
                Tambah Tenant
              </button>
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
                                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleTenantStatus(tenant)}
                                disabled={isTogglingTenant === tenant.id}
                                className="text-sm font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                                className="text-sm font-semibold text-rose-600 hover:text-rose-700"
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

        {/* Plans Management */}
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
          <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <SectionTitle icon={<Package className="h-4 w-4" />} title="Subscription Plans" />
            <button
              onClick={handleCreatePlan}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Tambah Plan
            </button>
          </div>
          {isLoading ? (
            <PlanGridSkeleton count={3} />
          ) : (
            <div className="grid gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500">
                  Tidak ada plan ditemukan
                </div>
              ) : (
                plans.map((plan) => {
                  const finalPrice = calculatePlanPrice(plan);
                  const hasDiscount = plan.discount_percentage || plan.discount_amount;
                  return (
                    <div key={plan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                        {!plan.is_active && (
                          <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        {hasDiscount ? (
                          <div>
                            <p className="text-sm text-slate-500 line-through">
                              {currencyFormatter.format(parseFloat(plan.price_monthly))}
                            </p>
                            <p className="text-2xl font-bold text-emerald-600">
                              {currencyFormatter.format(finalPrice)}
                              <span className="text-sm font-normal text-slate-600">/bulan</span>
                            </p>
                            {plan.discount_percentage && (
                              <p className="text-xs text-emerald-600 mt-1">
                                Diskon {plan.discount_percentage}%
                              </p>
                            )}
                            {plan.discount_amount && (
                              <p className="text-xs text-emerald-600 mt-1">
                                Diskon Rp {parseFloat(plan.discount_amount).toLocaleString("id-ID")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-slate-900">
                            {currencyFormatter.format(parseFloat(plan.price_monthly))}
                            <span className="text-sm font-normal text-slate-600">/bulan</span>
                          </p>
                        )}
                      </div>
                      {plan.description && (
                        <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                      )}
                      <ul className="mt-4 space-y-2 text-sm text-slate-600">
                        {plan.features_json && plan.features_json.length > 0 ? (
                          plan.features_json.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-600">•</span>
                              <span>{feature}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-400">Tidak ada fitur</li>
                        )}
                      </ul>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <Edit className="mr-2 inline h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
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

      <PlanFormModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setSelectedPlan(null);
        }}
        onSubmit={handlePlanSubmit}
        plan={selectedPlan}
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

      <ConfirmModal
        isOpen={!!planToDelete}
        onClose={() => {
          if (!isDeletingPlan) {
            setPlanToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeletePlan}
        title="Hapus Plan"
        message={`Apakah Anda yakin ingin menghapus plan "${planToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={isDeletingPlan}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
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
  const variants: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", variants[status] ?? "bg-slate-100 text-slate-700")}>
      {status}
    </span>
  );
}
