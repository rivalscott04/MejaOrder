"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ToggleSwitch } from "@/components/shared/toggle-switch";
import type { SuperAdminTenant, CreateTenantPayload, UpdateTenantPayload } from "@/lib/api-client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTenantFormSchema,
  updateTenantFormSchema,
} from "@/lib/validations";
import type { z } from "zod";
import { cn } from "@/lib/utils";

type TenantFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTenantPayload | UpdateTenantPayload) => Promise<void>;
  tenant?: SuperAdminTenant | null;
};

export function TenantFormModal({ isOpen, onClose, onSubmit, tenant }: TenantFormModalProps) {
  const isEditMode = !!tenant;
  const schema = isEditMode ? updateTenantFormSchema : createTenantFormSchema;
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      logo_url: "",
      address: "",
      phone: "",
      timezone: "Asia/Jakarta",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (tenant) {
        reset({
          name: tenant.name,
          slug: tenant.slug,
          logo_url: tenant.logo_url || "",
          address: tenant.address || "",
          phone: tenant.phone || "",
          timezone: tenant.timezone || "Asia/Jakarta",
          is_active: tenant.is_active,
        });
      } else {
        reset({
          name: "",
          slug: "",
          logo_url: "",
          address: "",
          phone: "",
          timezone: "Asia/Jakarta",
          is_active: true,
        });
      }
    }
  }, [isOpen, tenant, reset]);

  const onFormSubmit = async (data: FormData) => {
    try {
      const payload: CreateTenantPayload | UpdateTenantPayload = {
        ...data,
        logo_url: data.logo_url || null,
        address: data.address || null,
        phone: data.phone || null,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      throw err;
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isEditMode) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setValue("slug", slug);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {tenant ? "Edit Tenant" : "Tambah Tenant Baru"}
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
              Nama Tenant <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              onChange={(e) => {
                register("name").onChange(e);
                handleNameChange(e);
              }}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.name ? "border-rose-300" : ""
              )}
              placeholder="Nama tenant"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("slug")}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.slug ? "border-rose-300" : ""
              )}
              placeholder="slug-tenant"
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-rose-600">{errors.slug.message}</p>
            )}
            {!isEditMode && !errors.slug && (
              <p className="mt-1 text-xs text-slate-500">Slug akan otomatis dibuat dari nama tenant</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Logo URL
            </label>
            <input
              type="url"
              {...register("logo_url")}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.logo_url ? "border-rose-300" : ""
              )}
              placeholder="https://example.com/logo.png"
            />
            {errors.logo_url && (
              <p className="mt-1 text-xs text-rose-600">{errors.logo_url.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Alamat
            </label>
            <textarea
              {...register("address")}
              rows={2}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.address ? "border-rose-300" : ""
              )}
              placeholder="Alamat tenant"
            />
            {errors.address && (
              <p className="mt-1 text-xs text-rose-600">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nomor Telepon
              </label>
              <input
                type="text"
                {...register("phone")}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                  errors.phone ? "border-rose-300" : ""
                )}
                placeholder="081234567890"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Timezone
              </label>
              <input
                type="text"
                {...register("timezone")}
                className={cn(
                  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                  errors.timezone ? "border-rose-300" : ""
                )}
                placeholder="Asia/Jakarta"
              />
              {errors.timezone && (
                <p className="mt-1 text-xs text-rose-600">{errors.timezone.message}</p>
              )}
            </div>
          </div>

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <ToggleSwitch
                checked={field.value ?? true}
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
              {isSubmitting ? "Menyimpan..." : tenant ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

