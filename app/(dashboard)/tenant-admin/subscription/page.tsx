"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { SectionTitle } from "@/components/shared/section-title";
import { Toast } from "@/components/shared/toast";
import { StatsGridSkeleton } from "@/components/shared/menu-skeleton";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { fetchTenantSettings, fetchAvailablePlans, cancelSubscription, type Plan, type TenantSettings } from "@/lib/api-client";
import { cn, currencyFormatter, formatFeatureText } from "@/lib/utils";
import { getCurrentUser, type LoginResponse } from "@/lib/api-client";
import {
  ShieldCheck,
  Package,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

type SubscriptionInfo = {
  plan: string;
  planId?: number;
  status: string;
  expiresAt: string;
  startDate?: string;
};

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [tenantName, setTenantName] = useState<string>("");
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [settings, user] = await Promise.all([
        fetchTenantSettings().catch(() => null),
        getCurrentUser().catch(() => null),
      ]);

      if (settings) {
        setTenantName(settings.name);
        
        if (settings.subscription) {
          setSubscriptionInfo({
            plan: settings.subscription.plan,
            status: settings.subscription.status,
            expiresAt: settings.subscription.expires_at,
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
      console.error("Failed to load subscription data:", error);
      setToast({ message: "Gagal memuat data subscription", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      setIsLoadingPlans(true);
      const response = await fetchAvailablePlans();
      setAvailablePlans(response.data.filter(plan => plan.is_active));
    } catch (error) {
      console.error("Failed to load plans:", error);
      // If it fails due to permission, show message
      setToast({ 
        message: "Tidak dapat memuat daftar paket. Silakan hubungi admin untuk informasi paket.", 
        variant: "error" 
      });
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadData();
    loadAvailablePlans();
  }, []);

  const handleUpgradeRequest = (planId: number, planName: string) => {
    // For now, show a message that they need to contact admin
    // In the future, this could trigger an API call to request upgrade
    setToast({ 
      message: `Permintaan upgrade ke paket ${planName} telah dicatat. Silakan hubungi admin untuk proses selanjutnya.`, 
      variant: "success" 
    });
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCanceling(true);
      await cancelSubscription();
      setToast({ 
        message: "Subscription berhasil dibatalkan", 
        variant: "success" 
      });
      setShowCancelConfirm(false);
      // Reload data to reflect the cancellation
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

  const displayName = userData?.user.name || "Admin";
  const displayEmail = userData?.user.email || "";

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "expired":
        return "text-rose-600 bg-rose-50 border-rose-200";
      case "trial":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "canceled":
        return "text-slate-600 bg-slate-50 border-slate-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <CheckCircle2 className="h-4 w-4" />;
      case "expired":
        return <XCircle className="h-4 w-4" />;
      case "canceled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "-") return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const calculateDiscountedPrice = (plan: Plan) => {
    let price = parseFloat(plan.price_monthly);
    if (plan.discount_percentage) {
      const basePrice = plan.discount_type === "yearly" && plan.price_yearly 
        ? parseFloat(plan.price_yearly) 
        : parseFloat(plan.price_monthly);
      price = basePrice * (1 - parseFloat(plan.discount_percentage) / 100);
    }
    return Math.max(0, price);
  };

  const isCurrentPlan = (plan: Plan) => {
    return subscriptionInfo?.plan === plan.name;
  };

  // Helper function to safely get features as array
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

  return (
    <DashboardLayout role="tenant-admin" userEmail={displayEmail} userName={displayName}>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Manajemen Subscription
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Lihat paket subscription Anda dan kelola upgrade paket
          </p>
        </div>

        {/* Current Subscription */}
        {isLoading ? (
          <StatsGridSkeleton count={1} />
        ) : (
          <div className="mb-6 lg:mb-8 rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
            <SectionTitle icon={<ShieldCheck className="h-4 w-4" />} title="Subscription Saat Ini" />
            {subscriptionInfo ? (
              <div className="mt-4 lg:mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4 lg:p-6">
                    <p className="text-xs text-slate-500 mb-1">Paket</p>
                    <p className="text-lg lg:text-xl font-bold text-slate-900">{subscriptionInfo.plan}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 lg:p-6">
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold",
                      getStatusColor(subscriptionInfo.status)
                    )}>
                      {getStatusIcon(subscriptionInfo.status)}
                      {subscriptionInfo.status}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 lg:p-6">
                    <p className="text-xs text-slate-500 mb-1">Berlaku Hingga</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <p className="text-lg lg:text-xl font-bold text-slate-900">
                        {formatDate(subscriptionInfo.expiresAt)}
                      </p>
                    </div>
                  </div>
                </div>
                {(subscriptionInfo.status.toLowerCase() === "active" || subscriptionInfo.status.toLowerCase() === "trial") && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-slate-600 mb-2">
                          Anda dapat membatalkan subscription kapan saja. Setelah dibatalkan, akses ke fitur premium akan berakhir pada tanggal berakhir subscription.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={isCanceling}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                        "bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed",
                        "shadow-sm hover:shadow-md"
                      )}
                    >
                      {isCanceling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Membatalkan...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Batalkan Subscription
                        </>
                      )}
                    </button>
                  </div>
                )}
                {subscriptionInfo.status.toLowerCase() === "canceled" && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-slate-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 mb-1">
                            Subscription Telah Dibatalkan
                          </p>
                          <p className="text-xs text-slate-600">
                            Subscription Anda telah dibatalkan. Akses ke fitur premium akan berakhir pada {formatDate(subscriptionInfo.expiresAt)}. 
                            Untuk mengaktifkan kembali, silakan hubungi super admin.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 lg:mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Tidak ada subscription aktif</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Silakan hubungi admin untuk mengaktifkan subscription
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Available Plans */}
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
          <SectionTitle icon={<Package className="h-4 w-4" />} title="Paket Tersedia" />
          
          {isLoadingPlans ? (
            <div className="mt-4 lg:mt-6">
              <StatsGridSkeleton count={3} />
            </div>
          ) : availablePlans.length > 0 ? (
            <div className="mt-4 lg:mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availablePlans.map((plan) => {
                const discountedPrice = calculateDiscountedPrice(plan);
                const isCurrent = isCurrentPlan(plan);
                const isExpired = subscriptionInfo?.status.toLowerCase() === "expired";
                const canUpgrade = !isCurrent && (isExpired || subscriptionInfo?.status.toLowerCase() === "active");

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-xl border p-4 lg:p-6 transition",
                      isCurrent
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md"
                    )}
                  >
                    {isCurrent && (
                      <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        Paket Saat Ini
                      </div>
                    )}
                    
                    <h3 className="text-lg lg:text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    
                    {plan.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{plan.description}</p>
                    )}

                    <div className="mb-4 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl lg:text-3xl font-bold text-slate-900">
                          {currencyFormatter.format(discountedPrice)}
                        </span>
                        <span className="text-sm text-slate-500">/bulan</span>
                      </div>
                      {plan.discount_percentage ? (
                        <p className="text-xs text-slate-500 line-through">
                          {currencyFormatter.format(parseFloat(plan.price_monthly))}/bulan
                        </p>
                      ) : null}
                      {plan.price_yearly && (
                        <p className="text-xs text-emerald-600 font-semibold">
                          {currencyFormatter.format(parseFloat(plan.price_yearly))}/tahun
                        </p>
                      )}
                    </div>

                    {(() => {
                      const features = getFeaturesArray(plan.features_json);
                      
                      return features.length > 0 ? (
                        <ul className="mb-4 space-y-2">
                          {features.slice(0, 4).map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{formatFeatureText(feature)}</span>
                            </li>
                          ))}
                          {features.length > 4 && (
                            <li className="text-xs text-slate-500 pl-6">
                              +{features.length - 4} fitur lainnya
                            </li>
                          )}
                        </ul>
                      ) : null;
                    })()}

                    {plan.max_users && (
                      <p className="text-xs text-slate-500 mb-4">
                        Maks. {plan.max_users} pengguna
                      </p>
                    )}

                    <button
                      onClick={() => handleUpgradeRequest(plan.id, plan.name)}
                      disabled={isCurrent || !canUpgrade}
                      className={cn(
                        "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2",
                        isCurrent
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : canUpgrade
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Paket Aktif
                        </>
                      ) : canUpgrade ? (
                        <>
                          <ArrowUpRight className="h-4 w-4" />
                          {isExpired ? "Aktifkan" : "Upgrade"}
                        </>
                      ) : (
                        "Hubungi Admin"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 lg:mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Tidak ada paket tersedia</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Silakan hubungi admin untuk informasi paket subscription
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact Admin Section */}
        <div className="mt-6 lg:mt-8 rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 lg:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-50 p-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Butuh Bantuan dengan Subscription?
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Untuk upgrade, downgrade, atau perpanjangan subscription, silakan hubungi admin.
              </p>
              <button
                onClick={() => {
                  setToast({ 
                    message: "Silakan hubungi admin melalui email atau kontak yang tersedia", 
                    variant: "success" 
                  });
                }}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Hubungi Admin
              </button>
            </div>
          </div>
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
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelSubscription}
        title="Batalkan Subscription"
        message="Apakah Anda yakin ingin membatalkan subscription? Setelah dibatalkan, Anda tidak akan dapat menggunakan fitur premium hingga subscription diaktifkan kembali."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tidak"
        variant="danger"
        isLoading={isCanceling}
      />
    </DashboardLayout>
  );
}

