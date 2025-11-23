"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ToggleSwitch } from "@/components/shared/toggle-switch";
import type { Table, CreateTablePayload, UpdateTablePayload } from "@/lib/api-client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tableFormSchema, type TableFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";

type TableFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTablePayload | UpdateTablePayload) => Promise<void>;
  table?: Table | null;
};

export function TableFormModal({ isOpen, onClose, onSubmit, table }: TableFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TableFormData>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      table_number: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (table) {
        reset({
          table_number: table.table_number,
          description: table.description || "",
          is_active: table.is_active,
        });
      } else {
        reset({
          table_number: "",
          description: "",
          is_active: true,
        });
      }
    }
  }, [isOpen, table, reset]);

  const onFormSubmit = async (data: TableFormData) => {
    try {
      // Convert empty description to null
      const payload = {
        ...data,
        description: data.description?.trim() || null,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      // Error akan ditangani oleh parent component
      throw err;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {table ? "Edit Meja" : "Tambah Meja Baru"}
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
              Nomor Meja <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("table_number")}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.table_number ? "border-rose-300" : ""
              )}
              placeholder="Contoh: 01, 12, A1"
            />
            {errors.table_number && (
              <p className="mt-1 text-xs text-rose-600">{errors.table_number.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Deskripsi
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none resize-none",
                errors.description ? "border-rose-300" : ""
              )}
              placeholder="Deskripsi meja (opsional)"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
            )}
          </div>

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <ToggleSwitch
                checked={field.value}
                onChange={field.onChange}
                label="Aktif"
              />
            )}
          />

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
              {isSubmitting ? "Menyimpan..." : table ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

