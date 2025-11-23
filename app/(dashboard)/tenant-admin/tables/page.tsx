"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { tenantContext, tenantTables } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { QrCode, Plus, Edit, Trash2, Copy, Check, Loader2 } from "lucide-react";
import { TableFormModal } from "@/components/tenant/table-form-modal";
import { QrPrintModal } from "@/components/tenant/qr-print-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AlertModal } from "@/components/shared/alert-modal";
import { CardGridSkeleton } from "@/components/shared/menu-skeleton";
import {
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateTableQr,
  printTableQr,
  downloadTableQr,
  getCurrentUser,
  type Table,
} from "@/lib/api-client";

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingRegenerate, setIsConfirmingRegenerate] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string>("");
  const [copiedTableId, setCopiedTableId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    loadTables();
    loadTenantSlug();
  }, []);

  const loadTenantSlug = async () => {
    try {
      const userData = await getCurrentUser();
      if (userData?.tenant?.slug) {
        setTenantSlug(userData.tenant.slug);
      } else {
        // Fallback to mock data
        setTenantSlug(tenantContext.slug);
      }
    } catch (err) {
      console.error("Failed to fetch tenant slug:", err);
      // Fallback to mock data
      setTenantSlug(tenantContext.slug);
    }
  };

  const loadTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        // Fallback to mock data
        setTables(
          tenantTables.map((t) => ({
            id: t.id,
            tenant_id: 1,
            table_number: t.number,
            qr_token: `qr-${t.id}-${Date.now()}`,
            is_active: t.status === "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        );
        return;
      }
      const response = await fetchTables();
      setTables(response.data || []);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat meja");
      // Fallback to mock data
      setTables(
        tenantTables.map((t) => ({
          id: t.id,
          tenant_id: 1,
          table_number: t.number,
          qr_token: `qr-${t.id}-${Date.now()}`,
          is_active: t.status === "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTable(null);
    setShowModal(true);
  };

  const handleEdit = (table: Table) => {
    setSelectedTable(table);
    setShowModal(true);
  };

  const handleSubmit = async (payload: any) => {
    try {
      if (selectedTable) {
        await updateTable(selectedTable.id, payload);
      } else {
        await createTable(payload);
      }
      await loadTables();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (tableId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Meja",
      message: "Apakah Anda yakin ingin menghapus meja ini? Tindakan ini tidak dapat dibatalkan.",
      variant: "danger",
      onConfirm: async () => {
        setIsConfirmingDelete(true);
        setIsDeleting(tableId);
        try {
          await deleteTable(tableId);
          await loadTables();
          setConfirmModal({ ...confirmModal, isOpen: false });
          setAlertModal({
            isOpen: true,
            title: "Berhasil",
            message: "Meja berhasil dihapus",
            variant: "success",
          });
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: "Gagal Menghapus",
            message: err instanceof Error ? err.message : "Gagal menghapus meja. Silakan coba lagi.",
            variant: "error",
          });
        } finally {
          setIsDeleting(null);
          setIsConfirmingDelete(false);
        }
      },
    });
  };

  const handleRegenerateQr = async (tableId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Regenerate QR Code",
      message: "Apakah Anda yakin ingin membuat ulang QR code? QR code lama tidak akan bisa digunakan lagi.",
      variant: "warning",
      onConfirm: async () => {
        setIsConfirmingRegenerate(true);
        setIsRegenerating(tableId);
        try {
          await regenerateTableQr(tableId);
          await loadTables();
          setConfirmModal({ ...confirmModal, isOpen: false });
          setAlertModal({
            isOpen: true,
            title: "Berhasil",
            message: "QR code berhasil dibuat ulang",
            variant: "success",
          });
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: "Gagal",
            message: err instanceof Error ? err.message : "Gagal membuat ulang QR code. Silakan coba lagi.",
            variant: "error",
          });
        } finally {
          setIsRegenerating(null);
          setIsConfirmingRegenerate(false);
        }
      },
    });
  };

  const handlePrintQr = async (table: Table) => {
    setIsLoadingQr(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (backendUrl) {
        const data = await printTableQr(table.id);
        setQrData(data);
        setShowQrModal(true);
      } else {
        // Fallback: use mock data
        setQrData({
          table_number: table.table_number,
          qr_token: table.qr_token,
          qr_url: `${window.location.origin}/o/${tenantContext.slug}/t/${table.qr_token}`,
          tenant_name: tenantContext.name,
        });
        setShowQrModal(true);
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Gagal Memuat",
        message: err instanceof Error ? err.message : "Gagal memuat data QR. Silakan coba lagi.",
        variant: "error",
      });
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleDownloadQr = async (table: Table) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (backendUrl) {
        const blob = await downloadTableQr(table.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `qr-table-${table.table_number}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: trigger print modal
        await handlePrintQr(table);
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Gagal Mengunduh",
        message: err instanceof Error ? err.message : "Gagal mengunduh QR code. Silakan coba lagi.",
        variant: "error",
      });
    }
  };

  const getQrUrl = (table: Table): string => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/o/${tenantSlug || tenantContext.slug}/t/${table.qr_token}`;
  };

  const handleCopyUrl = async (table: Table) => {
    const url = getQrUrl(table);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTableId(table.id);
      setTimeout(() => {
        setCopiedTableId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <DashboardLayout role="tenant-admin" userEmail="admin@brewhaven.id" userName="Admin BrewHaven">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Meja & QR Management</h1>
          <p className="mt-2 text-sm text-slate-600">Kelola meja dan QR code untuk pemesanan</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <SectionTitle icon={<QrCode className="h-4 w-4" />} title="Meja & QR Management" />
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Tambah Meja
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : tables.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Tidak ada meja</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={cn(
                    "rounded-2xl border p-4",
                    table.is_active ? "border-slate-200" : "border-amber-200 bg-amber-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Meja {table.table_number}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Status: {table.is_active ? "Aktif" : "Tidak Aktif"}
                      </p>
                      {table.description && (
                        <p className="mt-1 text-sm text-slate-700">
                          {table.description}
                        </p>
                      )}
                    </div>
                    <QrCode className="h-8 w-8 text-slate-400" />
                  </div>
                  {/* Dev: QR Endpoint URL */}
                  <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-600 mb-1">Endpoint (Dev):</p>
                        <p className="text-xs text-slate-500 truncate font-mono" title={getQrUrl(table)}>
                          {getQrUrl(table)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyUrl(table)}
                        className="flex-shrink-0 rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100 hover:border-slate-400"
                        title="Copy URL"
                      >
                        {copiedTableId === table.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEdit(table)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Edit className="mr-1 inline h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handlePrintQr(table)}
                      disabled={isLoadingQr}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isLoadingQr && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isLoadingQr ? "Memuat..." : "Cetak QR"}
                    </button>
                    <button
                      onClick={() => handleRegenerateQr(table.id)}
                      disabled={isRegenerating === table.id}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isRegenerating === table.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isRegenerating === table.id ? "Memproses..." : "Regen QR"}
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      disabled={isDeleting === table.id}
                      className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isDeleting === table.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <TableFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedTable(null);
          }}
          onSubmit={handleSubmit}
          table={selectedTable}
        />

        <QrPrintModal
          isOpen={showQrModal}
          onClose={() => {
            setShowQrModal(false);
            setQrData(null);
          }}
          qrData={qrData}
          onDownload={
            qrData
              ? () => {
                  const table = tables.find((t) => t.table_number === qrData.table_number);
                  if (table) {
                    handleDownloadQr(table);
                  }
                }
              : undefined
          }
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => {
            if (!isConfirmingDelete && !isConfirmingRegenerate) {
              setConfirmModal({ ...confirmModal, isOpen: false });
            }
          }}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          isLoading={isConfirmingDelete || isConfirmingRegenerate}
        />

        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
          title={alertModal.title}
          message={alertModal.message}
          variant={alertModal.variant}
        />
      </div>
    </DashboardLayout>
  );
}

