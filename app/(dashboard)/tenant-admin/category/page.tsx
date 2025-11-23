"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { FolderTree, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { CategoryFormModal } from "@/components/tenant/category-form-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AlertModal } from "@/components/shared/alert-modal";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCurrentUser,
  type Category,
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
  type LoginResponse,
} from "@/lib/api-client";
import { formatUserFriendlyError } from "@/lib/utils";

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
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
    loadCategories();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getCurrentUser();
      setUserData(data);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError(formatUserFriendlyError(err, "Gagal memuat kategori. Silakan refresh halaman atau hubungi administrator jika masalah berlanjut."));
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleSubmit = async (payload: CreateCategoryPayload | UpdateCategoryPayload) => {
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, payload);
        setAlertModal({
          isOpen: true,
          title: "Berhasil",
          message: "Kategori berhasil diperbarui",
          variant: "success",
        });
      } else {
        await createCategory(payload);
        setAlertModal({
          isOpen: true,
          title: "Berhasil",
          message: "Kategori berhasil ditambahkan",
          variant: "success",
        });
      }
      await loadCategories();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (categoryId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Kategori",
      message: "Apakah Anda yakin ingin menghapus kategori ini? Menu yang menggunakan kategori ini tidak akan terhapus, tetapi kategori akan dihapus dari menu tersebut.",
      variant: "danger",
      onConfirm: async () => {
        setIsConfirmingDelete(true);
        setIsDeleting(categoryId);
        try {
          await deleteCategory(categoryId);
          await loadCategories();
          setConfirmModal({ ...confirmModal, isOpen: false });
          setAlertModal({
            isOpen: true,
            title: "Berhasil",
            message: "Kategori berhasil dihapus",
            variant: "success",
          });
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: "Gagal Menghapus",
            message: err instanceof Error ? err.message : "Gagal menghapus kategori. Silakan coba lagi.",
            variant: "error",
          });
        } finally {
          setIsDeleting(null);
          setIsConfirmingDelete(false);
        }
      },
    });
  };

  const displayName = userData?.user.name || "Admin";
  const displayEmail = userData?.user.email || "";

  return (
    <DashboardLayout role="tenant-admin" userEmail={displayEmail} userName={displayName}>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Kelola Kategori</h1>
          <p className="mt-2 text-sm text-slate-600">Kelola kategori menu untuk mengorganisir produk Anda</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <SectionTitle icon={<FolderTree className="h-4 w-4" />} title="Daftar Kategori" />
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Tambah Kategori
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Memuat kategori...</div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <FolderTree className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">Belum ada kategori</p>
              <p className="text-sm text-slate-400 mb-4">Mulai dengan menambahkan kategori pertama Anda</p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" />
                Tambah Kategori
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categories
                .sort((a, b) => {
                  if (a.sort_order !== b.sort_order) {
                    return a.sort_order - b.sort_order;
                  }
                  return a.name.localeCompare(b.name);
                })
                .map((category) => (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{category.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Urutan: {category.sort_order}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Edit className="mr-1 inline h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={isDeleting === category.id}
                        className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 flex items-center justify-center"
                      >
                        {isDeleting === category.id ? (
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

        <CategoryFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedCategory(null);
          }}
          onSubmit={handleSubmit}
          category={selectedCategory}
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

