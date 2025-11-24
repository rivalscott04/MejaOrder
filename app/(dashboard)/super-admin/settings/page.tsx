"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Save, Loader2 } from "lucide-react";
import { Toast } from "@/components/shared/toast";
const getBackendUrl = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "";
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
};

const getAuthHeaders = () => {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

export default function SuperAdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState({
    is_enabled: false,
    message: "",
    estimated_completion_at: null as string | null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadMaintenanceMode();
  }, []);

  const loadMaintenanceMode = async () => {
    try {
      setIsLoading(true);
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        throw new Error("Backend URL not configured");
      }

      const base = backendUrl.replace(/\/$/, "");
      const response = await fetch(`${base}/api/admin/settings/maintenance-mode`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenanceMode({
          is_enabled: data.is_enabled || false,
          message: data.message || "",
          estimated_completion_at: data.estimated_completion_at || null,
        });
      }
    } catch (error) {
      console.error("Failed to load maintenance mode:", error);
      showToast("Gagal memuat pengaturan maintenance mode", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        throw new Error("Backend URL not configured");
      }

      const base = backendUrl.replace(/\/$/, "");
      const response = await fetch(`${base}/api/admin/settings/maintenance-mode`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          is_enabled: maintenanceMode.is_enabled,
          message: maintenanceMode.message || null,
          estimated_completion_at: maintenanceMode.estimated_completion_at || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Gagal menyimpan pengaturan");
      }

      const data = await response.json();
      setMaintenanceMode({
        is_enabled: data.is_enabled || false,
        message: data.message || "",
        estimated_completion_at: data.estimated_completion_at || null,
      });

      showToast("Pengaturan maintenance mode berhasil disimpan", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal menyimpan pengaturan", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role="super-admin" userEmail="admin@orderops.com" userName="Super Admin">
      <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Pengaturan Platform</h1>
          <p className="mt-2 text-sm text-slate-600">
            Kelola maintenance mode untuk seluruh platform. Maintenance mode ini akan mempengaruhi semua tenant dan customer di platform. 
            Untuk maintenance mode per tenant, gunakan menu Settings di halaman tenant admin.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="py-12 text-center text-slate-500">Memuat pengaturan...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Maintenance Mode Toggle */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Maintenance Mode</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Aktifkan maintenance mode untuk menampilkan halaman maintenance ke semua customer
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={maintenanceMode.is_enabled}
                    onChange={(e) =>
                      setMaintenanceMode({ ...maintenanceMode, is_enabled: e.target.checked })
                    }
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300"></div>
                </label>
              </div>
            </div>

            {maintenanceMode.is_enabled && (
              <>
                {/* Maintenance Message */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Pesan Maintenance</h2>
                  <p className="mb-4 text-sm text-slate-600">
                    Pesan yang akan ditampilkan kepada customer saat maintenance mode aktif
                  </p>
                  <textarea
                    value={maintenanceMode.message}
                    onChange={(e) =>
                      setMaintenanceMode({ ...maintenanceMode, message: e.target.value })
                    }
                    placeholder="Contoh: Sistem sedang dalam pemeliharaan. Kami akan kembali segera. Terima kasih atas pengertian Anda."
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Estimated Completion Time */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Estimasi Waktu Selesai</h2>
                  <p className="mb-4 text-sm text-slate-600">
                    Tentukan kapan maintenance diperkirakan selesai (untuk countdown timer)
                  </p>
                  <input
                    type="datetime-local"
                    value={
                      maintenanceMode.estimated_completion_at
                        ? new Date(maintenanceMode.estimated_completion_at).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setMaintenanceMode({
                        ...maintenanceMode,
                        estimated_completion_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </div>
        )}

        {toast && (
          <Toast
            isOpen={!!toast}
            message={toast.message}
            variant={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

