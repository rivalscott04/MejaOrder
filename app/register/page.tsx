"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Building2, Mail, Lock, Eye, EyeOff, User, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/shared/alert-modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { register as registerUser } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const tenantName = watch("tenantName");

  // Auto-generate slug from tenant name
  const handleTenantNameChange = (name: string) => {
    setValue("tenantName", name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setValue("tenantSlug", slug);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await registerUser({
        tenant_name: data.tenantName,
        tenant_slug: data.tenantSlug,
        admin_name: data.adminName,
        admin_email: data.adminEmail,
        password: data.password,
        password_confirmation: data.confirmPassword,
      });

      // Auto login after registration, redirect to tenant admin dashboard
      router.push("/tenant-admin");
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Registrasi gagal. Silakan coba lagi.";
      setAlertModal({
        isOpen: true,
        title: "Registrasi Gagal",
        message: errorMessage,
        variant: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 mb-4">
            <UserPlus className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Daftar Tenant Baru</h1>
          <p className="text-sm text-slate-600">
            Buat akun tenant baru untuk mulai menggunakan sistem QR ordering
          </p>
        </div>

        {/* Registration Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tenant Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Informasi Tenant</h2>
              </div>

              {/* Tenant Name */}
              <div>
                <label htmlFor="tenantName" className="block text-sm font-semibold text-slate-700 mb-2">
                  Nama Tenant / Kafe
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="tenantName"
                    type="text"
                    {...register("tenantName")}
                    onChange={(e) => handleTenantNameChange(e.target.value)}
                    className={cn(
                      "w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none",
                      errors.tenantName ? "border-rose-300" : "border-slate-200"
                    )}
                    placeholder="BrewHaven Coffee"
                  />
                </div>
                {errors.tenantName && (
                  <p className="mt-1 text-xs text-rose-600">{errors.tenantName.message}</p>
                )}
              </div>

              {/* Tenant Slug */}
              <div>
                <label htmlFor="tenantSlug" className="block text-sm font-semibold text-slate-700 mb-2">
                  Slug Tenant (URL)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="tenantSlug"
                    type="text"
                    {...register("tenantSlug")}
                    onChange={(e) => {
                      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setValue("tenantSlug", slug);
                    }}
                    className={cn(
                      "w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none font-mono",
                      errors.tenantSlug ? "border-rose-300" : "border-slate-200"
                    )}
                    placeholder="brewhaven-coffee"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  URL akan menjadi: /o/{watch("tenantSlug") || "tenant-slug"}
                </p>
                {errors.tenantSlug && (
                  <p className="mt-1 text-xs text-rose-600">{errors.tenantSlug.message}</p>
                )}
              </div>
            </div>

            {/* Admin Information Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Informasi Admin</h2>
              </div>

              {/* Admin Name */}
              <div>
                <label htmlFor="adminName" className="block text-sm font-semibold text-slate-700 mb-2">
                  Nama Admin
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="adminName"
                    type="text"
                    {...register("adminName")}
                    className={cn(
                      "w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none",
                      errors.adminName ? "border-rose-300" : "border-slate-200"
                    )}
                    placeholder="John Doe"
                  />
                </div>
                {errors.adminName && (
                  <p className="mt-1 text-xs text-rose-600">{errors.adminName.message}</p>
                )}
              </div>

              {/* Admin Email */}
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Admin
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="adminEmail"
                    type="email"
                    {...register("adminEmail")}
                    className={cn(
                      "w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none",
                      errors.adminEmail ? "border-rose-300" : "border-slate-200"
                    )}
                    placeholder="admin@kafe.com"
                  />
                </div>
                {errors.adminEmail && (
                  <p className="mt-1 text-xs text-rose-600">{errors.adminEmail.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={cn(
                      "w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-11 text-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none",
                      errors.password ? "border-rose-300" : "border-slate-200"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={cn(
                      "w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-11 text-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none",
                      errors.confirmPassword ? "border-rose-300" : "border-slate-200"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-600">
                  Saya setuju dengan{" "}
                  <Link
                    href="/terms-and-conditions"
                    target="_blank"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Syarat & Ketentuan
                  </Link>{" "}
                  dan{" "}
                  <Link
                    href="/contact"
                    target="_blank"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Kebijakan Privasi
                  </Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs font-semibold text-slate-500 uppercase">atau</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              Kembali ke Beranda
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-900">
              Kontak
            </Link>
            <span>•</span>
            <Link href="/terms-and-conditions" className="hover:text-slate-900">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  );
}

