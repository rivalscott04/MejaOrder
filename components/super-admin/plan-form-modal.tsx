"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { ToggleSwitch } from "@/components/shared/toggle-switch";
import type { Plan, CreatePlanPayload, UpdatePlanPayload } from "@/lib/api-client";
import { useForm, Controller, useFieldArray, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPlanFormSchema,
  updatePlanFormSchema,
} from "@/lib/validations";
import type { z } from "zod";
import { cn, formatPriceInput, parsePriceInput } from "@/lib/utils";

type PlanFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePlanPayload | UpdatePlanPayload) => Promise<void>;
  plan?: Plan | null;
};

export function PlanFormModal({ isOpen, onClose, onSubmit, plan }: PlanFormModalProps) {
  const isEditMode = !!plan;
  const schema = isEditMode ? updatePlanFormSchema : createPlanFormSchema;
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: null,
      max_tenants: null,
      max_users: null,
      max_menus: null,
      features_json: [],
      discount_percentage: null,
      discount_type: null, // 'monthly' or 'yearly'
      discount_start_date: null,
      discount_end_date: null,
      is_active: true,
    },
  });

  // Type assertion needed because FormData is a union type, but both schemas have features_json
  const { fields, append, remove } = useFieldArray({
    control: control as any,
    name: "features_json",
  });

  const discountPercentage = watch("discount_percentage");
  const discountType = watch("discount_type");
  const priceMonthly = watch("price_monthly");
  const priceYearly = watch("price_yearly");

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        reset({
          name: plan.name,
          description: plan.description || "",
          price_monthly: parseFloat(plan.price_monthly),
          price_yearly: plan.price_yearly ? parseFloat(plan.price_yearly) : null,
          max_tenants: plan.max_tenants,
          max_users: plan.max_users,
          max_menus: plan.max_menus,
          features_json: plan.features_json || [],
          discount_percentage: plan.discount_percentage ? parseFloat(plan.discount_percentage) : null,
          discount_type: plan.discount_type || null,
          discount_start_date: plan.discount_start_date || null,
          discount_end_date: plan.discount_end_date || null,
          is_active: plan.is_active,
        });
      } else {
        reset({
          name: "",
          description: "",
          price_monthly: 0,
          price_yearly: null,
          max_tenants: null,
          max_users: null,
          max_menus: null,
          features_json: [],
          discount_percentage: null,
          discount_type: null,
          discount_start_date: null,
          discount_end_date: null,
          is_active: true,
        });
      }
    }
  }, [isOpen, plan, reset]);

  const onFormSubmit = async (data: FormData) => {
    try {
      const payload: CreatePlanPayload | UpdatePlanPayload = {
        ...data,
        description: data.description || null,
        price_yearly: data.price_yearly || null,
        max_tenants: data.max_tenants || null,
        max_users: data.max_users || null,
        max_menus: data.max_menus || null,
        features_json: data.features_json && data.features_json.length > 0 ? data.features_json : undefined,
        discount_percentage: data.discount_percentage || null,
        discount_type: data.discount_type || null,
        discount_start_date: data.discount_start_date || null,
        discount_end_date: data.discount_end_date || null,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      throw err;
    }
  };

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    const basePrice = discountType === "yearly" && priceYearly ? priceYearly : priceMonthly;
    if (!basePrice) return 0;
    if (discountPercentage) {
      return Math.max(0, basePrice * (1 - discountPercentage / 100));
    }
    return basePrice;
  };

  const finalPrice = calculateDiscountedPrice();
  const basePrice = discountType === "yearly" && priceYearly ? priceYearly : priceMonthly;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {plan ? "Edit Plan/Pricing" : "Tambah Plan/Pricing Baru"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nama Plan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                  errors.name ? "border-rose-300" : ""
                )}
                placeholder="Starter, Growth, etc."
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <div className="pt-2">
                    <ToggleSwitch
                      checked={field.value ?? true}
                      onChange={field.onChange}
                      label="Aktif"
                    />
                  </div>
                )}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Deskripsi
            </label>
            <textarea
              {...register("description")}
              rows={2}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.description ? "border-rose-300" : ""
              )}
              placeholder="Deskripsi plan"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Harga Bulanan <span className="text-red-500">*</span>
              </label>
              <Controller
                name="price_monthly"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">Rp</span>
                    <input
                      type="text"
                      value={field.value ? field.value.toLocaleString("id-ID") : "0"}
                      onChange={(e) => {
                        const price = parsePriceInput(e.target.value);
                        field.onChange(price);
                      }}
                      onBlur={() => {
                        const price = watch("price_monthly");
                        if (price !== undefined && price < 0) {
                          field.onChange(0);
                        }
                      }}
                      className={cn(
                        "w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-all duration-200 hover:border-slate-300",
                        errors.price_monthly ? "border-rose-300" : ""
                      )}
                      placeholder="0"
                    />
                  </div>
                )}
              />
              {errors.price_monthly && (
                <p className="mt-1 text-xs text-rose-600">{errors.price_monthly.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Harga Tahunan
              </label>
              <Controller
                name="price_yearly"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">Rp</span>
                    <input
                      type="text"
                      value={field.value ? field.value.toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const price = parsePriceInput(e.target.value);
                        field.onChange(price || null);
                      }}
                      onBlur={() => {
                        const price = watch("price_yearly");
                        if (price && price < 0) {
                          field.onChange(null);
                        }
                      }}
                      className={cn(
                        "w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-all duration-200 hover:border-slate-300",
                        errors.price_yearly ? "border-rose-300" : ""
                      )}
                      placeholder="0"
                    />
                  </div>
                )}
              />
              {errors.price_yearly && (
                <p className="mt-1 text-xs text-rose-600">{errors.price_yearly.message}</p>
              )}
            </div>
          </div>

          {/* Discount Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Pengaturan Diskon</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Diskon Persentase (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register("discount_percentage", { valueAsNumber: true })}
                  className={cn(
                    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-all duration-200 hover:border-slate-300",
                    errors.discount_percentage ? "border-rose-300" : ""
                  )}
                  placeholder="0"
                />
                {errors.discount_percentage && (
                  <p className="mt-1 text-xs text-rose-600">{errors.discount_percentage.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Diskon Untuk
                </label>
                <Controller
                  name="discount_type"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          value="monthly"
                          checked={field.value === "monthly"}
                          onChange={() => field.onChange("monthly")}
                          className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 focus:ring-2 cursor-pointer transition-all duration-200"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Bulanan</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          value="yearly"
                          checked={field.value === "yearly"}
                          onChange={() => field.onChange("yearly")}
                          className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 focus:ring-2 cursor-pointer transition-all duration-200"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Tahunan</span>
                      </label>
                    </div>
                  )}
                />
                {errors.discount_type && (
                  <p className="mt-1 text-xs text-rose-600">{errors.discount_type.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tanggal Mulai Diskon
                </label>
                <input
                  type="date"
                  {...register("discount_start_date")}
                  className={cn(
                    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-all duration-200 hover:border-slate-300 cursor-pointer",
                    errors.discount_start_date ? "border-rose-300" : ""
                  )}
                />
                {errors.discount_start_date && (
                  <p className="mt-1 text-xs text-rose-600">{errors.discount_start_date.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tanggal Akhir Diskon
                </label>
                <input
                  type="date"
                  {...register("discount_end_date")}
                  className={cn(
                    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-all duration-200 hover:border-slate-300 cursor-pointer",
                    errors.discount_end_date ? "border-rose-300" : ""
                  )}
                />
                {errors.discount_end_date && (
                  <p className="mt-1 text-xs text-rose-600">{errors.discount_end_date.message}</p>
                )}
              </div>
            </div>

            {discountPercentage && basePrice && basePrice > 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs font-semibold text-emerald-900 mb-1">Harga Setelah Diskon:</p>
                <p className="text-lg font-bold text-emerald-700">
                  Rp {finalPrice.toLocaleString("id-ID")}
                </p>
                {discountPercentage && basePrice && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Diskon {discountPercentage}% = Rp {(basePrice * discountPercentage / 100).toLocaleString("id-ID")}
                  </p>
                )}
                {discountType && (
                  <p className="text-xs text-slate-600 mt-1">
                    Diskon berlaku untuk harga {discountType === "yearly" ? "tahunan" : "bulanan"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Limits */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Maks. Tenant
              </label>
              <input
                type="number"
                min="0"
                {...register("max_tenants", { valueAsNumber: true })}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-all duration-200 hover:border-slate-300",
                  errors.max_tenants ? "border-rose-300" : ""
                )}
                placeholder="Unlimited"
              />
              {errors.max_tenants && (
                <p className="mt-1 text-xs text-rose-600">{errors.max_tenants.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Maks. User
              </label>
              <input
                type="number"
                min="0"
                {...register("max_users", { valueAsNumber: true })}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-all duration-200 hover:border-slate-300",
                  errors.max_users ? "border-rose-300" : ""
                )}
                placeholder="Unlimited"
              />
              {errors.max_users && (
                <p className="mt-1 text-xs text-rose-600">{errors.max_users.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Maks. Menu
              </label>
              <input
                type="number"
                min="0"
                {...register("max_menus", { valueAsNumber: true })}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition-all duration-200 hover:border-slate-300",
                  errors.max_menus ? "border-rose-300" : ""
                )}
                placeholder="Unlimited"
              />
              {errors.max_menus && (
                <p className="mt-1 text-xs text-rose-600">{errors.max_menus.message}</p>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">
                Fitur Plan
              </label>
              <button
                type="button"
                onClick={() => append("")}
                className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Tambah Fitur
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    type="text"
                    {...register(`features_json.${index}` as const)}
                    className={cn(
                      "flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                      errors.features_json?.[index] ? "border-rose-300" : ""
                    )}
                    placeholder="Contoh: 100 order/hari"
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition-all duration-200 hover:bg-rose-100 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-xs text-slate-500 py-2">Belum ada fitur. Klik "Tambah Fitur" untuk menambahkan.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-600 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? "Menyimpan..." : plan ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

