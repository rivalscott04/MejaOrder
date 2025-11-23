"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PlanFormModal } from "@/components/super-admin/plan-form-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Toast } from "@/components/shared/toast";
import {
  fetchPlans,
  createPlan,
  updatePlan,
  deletePlan,
  type Plan,
  type CreatePlanPayload,
  type UpdatePlanPayload,
} from "@/lib/api-client";
import { currencyFormatter } from "@/lib/utils";
import { Package, Plus, Edit, Trash2 } from "lucide-react";
import { PlanGridSkeleton } from "@/components/shared/menu-skeleton";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Plan modal states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  
  // Loading states
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const plansRes = await fetchPlans();
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
        showToast("Paket berhasil diupdate", "success");
      } else {
        await createPlan(payload as CreatePlanPayload);
        showToast("Paket berhasil dibuat", "success");
      }
      await loadData();
      setIsPlanModalOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan paket", "error");
      throw error;
    }
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeletingPlan(true);
    try {
      await deletePlan(planToDelete.id);
      showToast("Paket berhasil dihapus", "success");
      await loadData();
      setPlanToDelete(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menghapus paket", "error");
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const getFeaturesArray = (features: string[] | null | undefined): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Kelola Paket</h1>
          <p className="mt-2 text-sm text-slate-600">
            Kelola paket subscription yang tersedia untuk tenant. Paket ini adalah template yang bisa dipilih tenant untuk berlangganan.
          </p>
        </div>

        {/* Plans Management */}
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
          <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <SectionTitle icon={<Package className="h-4 w-4" />} title="Daftar Paket" />
            <button
              onClick={handleCreatePlan}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Tambah Paket
            </button>
          </div>
          {isLoading ? (
            <PlanGridSkeleton count={3} />
          ) : (
            <div className="grid gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500">
                  Tidak ada paket ditemukan
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
                        {(() => {
                          const features = getFeaturesArray(plan.features_json);
                          return features.length > 0 ? (
                            features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-600">•</span>
                                <span>{feature}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400">Tidak ada fitur</li>
                          );
                        })()}
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
        isOpen={!!planToDelete}
        onClose={() => {
          if (!isDeletingPlan) {
            setPlanToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeletePlan}
        title="Hapus Paket"
        message={`Apakah Anda yakin ingin menghapus paket "${planToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={isDeletingPlan}
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

