"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { cn, formatPriceInput, parsePriceInput } from "@/lib/utils";
import type { OptionGroup, OptionItem, CreateOptionGroupPayload, UpdateOptionGroupPayload, CreateOptionItemPayload, UpdateOptionItemPayload } from "@/lib/api-client";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const optionItemSchema = z.object({
  id: z.number().optional(),
  label: z.string().min(1, "Label wajib diisi").min(2, "Label minimal 2 karakter"),
  extra_price: z.number().min(0, "Harga tambahan tidak boleh negatif"),
  sort_order: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

const optionGroupFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nama variasi wajib diisi")
    .min(2, "Nama variasi minimal 2 karakter"),
  type: z.enum(["single_choice", "multi_choice"]),
  is_required: z.boolean().optional(),
  min_select: z.number().min(0).nullable().optional(),
  max_select: z.number().min(0).nullable().optional(),
  sort_order: z.number().min(0).optional(),
  items: z.array(optionItemSchema).min(1, "Minimal harus ada 1 opsi"),
});

type OptionGroupFormData = z.infer<typeof optionGroupFormSchema>;

type OptionGroupFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateOptionGroupPayload | UpdateOptionGroupPayload, items: (CreateOptionItemPayload | UpdateOptionItemPayload)[]) => Promise<void>;
  optionGroup?: OptionGroup | null;
};

export function OptionGroupFormModal({ isOpen, onClose, onSubmit, optionGroup }: OptionGroupFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OptionGroupFormData>({
    resolver: zodResolver(optionGroupFormSchema),
    defaultValues: {
      name: "",
      type: "single_choice",
      is_required: false,
      min_select: null,
      max_select: null,
      sort_order: 0,
      items: [{ label: "", extra_price: 0, sort_order: 0, is_active: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const groupType = watch("type");

  useEffect(() => {
    if (isOpen) {
      if (optionGroup) {
        reset({
          name: optionGroup.name,
          type: optionGroup.type,
          is_required: optionGroup.is_required ?? false,
          min_select: optionGroup.min_select ?? null,
          max_select: optionGroup.max_select ?? null,
          sort_order: optionGroup.sort_order ?? 0,
          items: optionGroup.items && optionGroup.items.length > 0
            ? optionGroup.items.map((item) => ({
                id: item.id,
                label: item.label,
                extra_price: parseFloat(item.extra_price) || 0,
                sort_order: item.sort_order ?? 0,
                is_active: item.is_active ?? true,
              }))
            : [{ label: "", extra_price: 0, sort_order: 0, is_active: true }],
        });
      } else {
        reset({
          name: "",
          type: "single_choice",
          is_required: false,
          min_select: null,
          max_select: null,
          sort_order: 0,
          items: [{ label: "", extra_price: 0, sort_order: 0, is_active: true }],
        });
      }
    }
  }, [isOpen, optionGroup, reset]);

  const onFormSubmit = async (data: OptionGroupFormData) => {
    try {
      const payload: CreateOptionGroupPayload | UpdateOptionGroupPayload = {
        name: data.name,
        type: data.type,
        is_required: data.is_required ?? false,
        min_select: data.min_select ?? null,
        max_select: data.max_select ?? null,
        sort_order: data.sort_order ?? 0,
      };

      const items = data.items.map((item, index) => ({
        label: item.label,
        extra_price: item.extra_price,
        sort_order: item.sort_order ?? index,
        is_active: item.is_active ?? true,
      }));

      await onSubmit(payload, items);
      onClose();
    } catch (err) {
      throw err;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {optionGroup ? "Edit Variasi Menu" : "Tambah Variasi Menu Baru"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nama Variasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                  errors.name ? "border-rose-300" : ""
                )}
                placeholder="Contoh: Temperature, Size, Topping"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tipe Pilihan <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("type")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="single_choice">Pilih 1 (Single Choice)</option>
                  <option value="multi_choice">Pilih Beberapa (Multi Choice)</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {groupType === "single_choice"
                    ? "Customer hanya bisa pilih 1 opsi"
                    : "Customer bisa pilih beberapa opsi"}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Urutan Tampil
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("sort_order", { valueAsNumber: true })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Angka lebih kecil akan ditampilkan lebih dulu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("is_required")}
                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              <label className="text-sm text-slate-700">
                Wajib dipilih customer saat memesan
              </label>
            </div>

            {groupType === "multi_choice" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Min. Pilihan
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register("min_select", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Max. Pilihan
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register("max_select", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Tidak terbatas"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Option Items */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">
                Daftar Opsi <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => append({ label: "", extra_price: 0, sort_order: fields.length, is_active: true })}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Plus className="h-3 w-3" />
                Tambah Opsi
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Tambahkan opsi-opsi yang bisa dipilih customer. Contoh: Hot, Iced, Small, Large, dll.
            </p>
            {errors.items && (
              <p className="mb-2 text-xs text-rose-600">{errors.items.message}</p>
            )}
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Nama Opsi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register(`items.${index}.label`)}
                        className={cn(
                          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none",
                          errors.items?.[index]?.label ? "border-rose-300" : ""
                        )}
                        placeholder="Contoh: Hot, Iced, Large"
                      />
                      {errors.items?.[index]?.label && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.items[index]?.label?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Harga Tambahan
                      </label>
                      <Controller
                        name={`items.${index}.extra_price`}
                        control={control}
                        render={({ field }) => (
                          <input
                            type="text"
                            value={formatPriceInput(field.value)}
                            onChange={(e) => {
                              const price = parsePriceInput(e.target.value);
                              field.onChange(price);
                            }}
                            onBlur={() => {
                              const price = watch(`items.${index}.extra_price`);
                              if (price < 0) {
                                field.onChange(0);
                              }
                            }}
                            className={cn(
                              "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none",
                              errors.items?.[index]?.extra_price ? "border-rose-300" : ""
                            )}
                            placeholder="0"
                          />
                        )}
                      />
                      {errors.items?.[index]?.extra_price && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.items[index]?.extra_price?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="rounded-lg border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
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
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Menyimpan..." : optionGroup ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

