"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Settings2, Plus, Edit, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { OptionGroupFormModal } from "@/components/tenant/option-group-form-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AlertModal } from "@/components/shared/alert-modal";
import {
  fetchOptionGroups,
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOptionItem,
  updateOptionItem,
  deleteOptionItem,
  getCurrentUser,
  type OptionGroup,
  type CreateOptionGroupPayload,
  type UpdateOptionGroupPayload,
  type CreateOptionItemPayload,
  type UpdateOptionItemPayload,
  type LoginResponse,
} from "@/lib/api-client";
import { formatUserFriendlyError } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function OptionGroupsPage() {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOptionGroup, setSelectedOptionGroup] = useState<OptionGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
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
    loadUserData();
    loadOptionGroups();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getCurrentUser();
      setUserData(data);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  const loadOptionGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const groups = await fetchOptionGroups();
      setOptionGroups(groups);
    } catch (err) {
      console.error("Failed to fetch option groups:", err);
      setError(formatUserFriendlyError(err, "Gagal memuat variasi menu. Silakan refresh halaman atau hubungi administrator jika masalah berlanjut."));
      setOptionGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedOptionGroup(null);
    setShowModal(true);
  };

  const handleEdit = (optionGroup: OptionGroup) => {
    setSelectedOptionGroup(optionGroup);
    setShowModal(true);
  };

  const handleSubmit = async (
    payload: CreateOptionGroupPayload | UpdateOptionGroupPayload,
    items: (CreateOptionItemPayload | UpdateOptionItemPayload)[]
  ) => {
    try {
      let group: OptionGroup;
      
      if (selectedOptionGroup) {
        // Update group
        group = await updateOptionGroup(selectedOptionGroup.id, payload);
        
        // Update items - delete all existing and create new ones
        // In production, you might want to do smarter diffing
        const existingItems = selectedOptionGroup.items || [];
        for (const item of existingItems) {
          try {
            await deleteOptionItem(item.id);
          } catch (err) {
            console.error("Failed to delete item:", err);
          }
        }
      } else {
        // Create new group
        group = await createOptionGroup(payload);
      }

      // Create all items
      for (const item of items) {
        await createOptionItem(group.id, item);
      }

      await loadOptionGroups();
      setAlertModal({
        isOpen: true,
        title: "Berhasil",
        message: selectedOptionGroup ? "Variasi menu berhasil diperbarui" : "Variasi menu berhasil ditambahkan",
        variant: "success",
      });
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (optionGroupId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Variasi Menu",
      message: "Apakah Anda yakin ingin menghapus variasi menu ini? Menu yang menggunakan variasi ini tidak akan terhapus, tetapi variasi akan dihapus dari menu tersebut.",
      variant: "danger",
      onConfirm: async () => {
        setIsConfirmingDelete(true);
        setIsDeleting(optionGroupId);
        try {
          await deleteOptionGroup(optionGroupId);
          await loadOptionGroups();
          setConfirmModal({ ...confirmModal, isOpen: false });
          setAlertModal({
            isOpen: true,
            title: "Berhasil",
            message: "Variasi menu berhasil dihapus",
            variant: "success",
          });
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: "Gagal Menghapus",
            message: formatUserFriendlyError(err, "Gagal menghapus variasi menu. Silakan coba lagi."),
            variant: "error",
          });
        } finally {
          setIsDeleting(null);
          setIsConfirmingDelete(false);
        }
      },
    });
  };

  const toggleExpand = (groupId: number) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const displayName = userData?.user.name || "Admin";
  const displayEmail = userData?.user.email || "";

  return (
    <DashboardLayout role="tenant-admin" userEmail={displayEmail} userName={displayName}>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Kelola Variasi Menu</h1>
          <p className="mt-2 text-sm text-slate-600">
            Kelola variasi menu seperti ukuran, suhu, topping, dll. Variasi ini bisa ditambahkan ke menu saat membuat menu baru.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <SectionTitle icon={<Settings2 className="h-4 w-4" />} title="Daftar Variasi Menu" />
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Tambah Variasi
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800 mb-3">{error}</p>
              <button
                onClick={loadOptionGroups}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-100 hover:bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  "Coba Lagi"
                )}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Memuat variasi menu...</div>
          ) : optionGroups.length === 0 ? (
            <div className="py-12 text-center">
              <Settings2 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">Belum ada variasi menu</p>
              <p className="text-sm text-slate-400 mb-4">
                Mulai dengan menambahkan variasi pertama Anda, seperti "Temperature", "Size", atau "Topping"
              </p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" />
                Tambah Variasi
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {optionGroups
                .sort((a, b) => {
                  if (a.sort_order !== b.sort_order) {
                    return a.sort_order - b.sort_order;
                  }
                  return a.name.localeCompare(b.name);
                })
                .map((group) => {
                  const isExpanded = expandedGroups.has(group.id);
                  const items = group.items || [];
                  return (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-slate-900">{group.name}</h3>
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-semibold",
                                group.type === "single_choice"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-purple-50 text-purple-700"
                              )}>
                                {group.type === "single_choice" ? "Pilih 1" : "Pilih Beberapa"}
                              </span>
                              {group.is_required && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                  Wajib
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>{items.length} opsi</span>
                              <span>Urutan: {group.sort_order}</span>
                              {group.type === "multi_choice" && (
                                <>
                                  {group.min_select !== null && group.min_select !== undefined && (
                                    <span>Min: {group.min_select}</span>
                                  )}
                                  {group.max_select !== null && group.max_select !== undefined && (
                                    <span>Max: {group.max_select}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(group.id)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="inline h-4 w-4 mr-1" />
                                  Sembunyikan
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="inline h-4 w-4 mr-1" />
                                  Lihat Opsi
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(group)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              <Edit className="inline h-4 w-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(group.id)}
                              disabled={isDeleting === group.id}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 flex items-center"
                            >
                              {isDeleting === group.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && items.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="mb-3 text-xs font-semibold text-slate-700">Daftar Opsi:</p>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {items
                                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                                .map((item) => (
                                  <div
                                    key={item.id}
                                    className={cn(
                                      "rounded-lg border p-2.5 text-sm",
                                      item.is_active
                                        ? "border-slate-200 bg-white"
                                        : "border-slate-100 bg-slate-50 opacity-60"
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-slate-700">{item.label}</span>
                                      {parseFloat(item.extra_price) > 0 && (
                                        <span className="text-xs font-semibold text-emerald-600">
                                          +Rp {parseFloat(item.extra_price).toLocaleString("id-ID")}
                                        </span>
                                      )}
                                    </div>
                                    {!item.is_active && (
                                      <p className="mt-1 text-xs text-slate-400">Tidak aktif</p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <OptionGroupFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedOptionGroup(null);
          }}
          onSubmit={handleSubmit}
          optionGroup={selectedOptionGroup}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => {
            if (!isConfirmingDelete) {
              setConfirmModal({ ...confirmModal, isOpen: false });
            }
          }}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          isLoading={isConfirmingDelete}
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

