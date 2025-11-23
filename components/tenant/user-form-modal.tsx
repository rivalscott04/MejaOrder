"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ToggleSwitch } from "@/components/shared/toggle-switch";
import type { TenantUser, CreateUserPayload, UpdateUserPayload } from "@/lib/api-client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserFormSchema,
  updateUserFormSchema,
} from "@/lib/validations";
import type { z } from "zod";
import { cn } from "@/lib/utils";

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void>;
  user?: TenantUser | null;
};

export function UserFormModal({ isOpen, onClose, onSubmit, user }: UserFormModalProps) {
  const isEditMode = !!user;
  const schema = isEditMode ? updateUserFormSchema : createUserFormSchema;
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "cashier",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          password: "",
          role: user.role,
          is_active: user.is_active,
        });
      } else {
        reset({
          name: "",
          email: "",
          password: "",
          role: "cashier",
          is_active: true,
        });
      }
    }
  }, [isOpen, user, reset]);

  const onFormSubmit = async (data: FormData) => {
    try {
      const payload: CreateUserPayload | UpdateUserPayload = { ...data };
      // Only include password if it's provided (for updates) or if it's a new user
      if (!user && !payload.password) {
        payload.password = "password123"; // Default password for new users
      } else if (user && !payload.password) {
        // Remove password from payload if updating and password is empty
        delete payload.password;
      }
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
            {user ? "Edit Pengguna" : "Tambah Pengguna Baru"}
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
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.name ? "border-rose-300" : ""
              )}
              placeholder="Nama lengkap"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register("email")}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.email ? "border-rose-300" : ""
              )}
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password {!user && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              {...register("password")}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.password ? "border-rose-300" : ""
              )}
              placeholder={user ? "Kosongkan jika tidak ingin mengubah" : "Minimal 6 karakter"}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
            {user && !errors.password && (
              <p className="mt-1 text-xs text-slate-500">Kosongkan jika tidak ingin mengubah password</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              {...register("role")}
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none",
                errors.role ? "border-rose-300" : ""
              )}
            >
              <option value="cashier">Kasir</option>
              <option value="tenant_admin">Admin Tenant</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-rose-600">{errors.role.message}</p>
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
              {isSubmitting ? "Menyimpan..." : user ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

