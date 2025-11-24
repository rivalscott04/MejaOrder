"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getCurrentUser, type LoginResponse } from "@/lib/api-client";

type TenantInfo = {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  tax_percentage: number;
  is_active: boolean;
};
import { User, Building2, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api-client";
import { AlertModal } from "@/components/shared/alert-modal";

export default function CashierSettingsPage() {
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
  });
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        setUserData(user);
        
        // Get tenant info from user response (already included)
        if (user?.tenant) {
          setTenantSettings({
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
            logo_url: null,
            address: null,
            phone: null,
            timezone: "Asia/Jakarta",
            tax_percentage: 0,
            is_active: true,
          });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setAlertModal({
          isOpen: true,
          title: "Error",
          message: "Gagal memuat data pengaturan",
          variant: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Gagal logout",
        variant: "error",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DashboardLayout role="cashier" userEmail={userData?.user.email} userName={userData?.user.name}>
      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Pengaturan</h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
            Kelola profil dan preferensi akun kasir
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="py-12 text-center text-sm text-slate-500">Memuat pengaturan...</div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Profile Section */}
            <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Profil Kasir</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Nama</label>
                  <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{userData?.user.name || "-"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Email</label>
                  <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{userData?.user.email || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Info Section */}
            {tenantSettings && (
              <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Informasi Tenant</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Nama Tenant</label>
                    <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{tenantSettings.name || "-"}</p>
                    </div>
                  </div>
                  {tenantSettings.address && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Alamat</label>
                      <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{tenantSettings.address}</p>
                      </div>
                    </div>
                  )}
                  {tenantSettings.phone && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Telepon</label>
                      <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{tenantSettings.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Logout */}
            <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {isLoggingOut ? "Logging out..." : "Keluar"}
              </button>
            </div>
          </div>
        )}
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </DashboardLayout>
  );
}

