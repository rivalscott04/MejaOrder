"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nama kategori wajib diisi")
    .min(2, "Nama kategori minimal 2 karakter"),
  sort_order: z.number().min(0, "Sort order tidak boleh negatif").optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

type CategoryFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCategoryPayload | UpdateCategoryPayload) => Promise<void>;
  category?: Category | null;
};

export function CategoryFormModal({ isOpen, onClose, onSubmit, category }: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (category) {
        reset({
          name: category.name,
          sort_order: category.sort_order,
        });
      } else {
        reset({
          name: "",
          sort_order: 0,
        });
      }
    }
  }, [isOpen, category, reset]);

  const onFormSubmit = async (data: CategoryFormData) => {
    try {
      const payload: CreateCategoryPayload | UpdateCategoryPayload = {
        name: data.name,
        sort_order: data.sort_order ?? 0,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      throw err;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {category ? "Edit Kategori" : "Tambah Kategori Baru"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.name ? "border-rose-300" : ""
              )}
              placeholder="Contoh: Minuman, Makanan, Snack"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Urutan Tampil
            </label>
            <input
              type="number"
              min="0"
              {...register("sort_order", { valueAsNumber: true })}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.sort_order ? "border-rose-300" : ""
              )}
              placeholder="0"
            />
            <p className="mt-1 text-xs text-slate-500">
              Angka lebih kecil akan ditampilkan lebih dulu (opsional)
            </p>
            {errors.sort_order && (
              <p className="mt-1 text-xs text-rose-600">{errors.sort_order.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Menyimpan..." : category ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}











