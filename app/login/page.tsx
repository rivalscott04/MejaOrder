"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { tenantContext } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/shared/alert-modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { login } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleDemoFill = () => {
    setValue("email", "demo@orderapp.test");
    setValue("password", "demo123");
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await login({
        email: data.email,
        password: data.password,
        remember: rememberMe,
      });

      // Redirect based on role
      if (response.user.role === "super_admin") {
        router.push("/super-admin");
      } else if (response.user.role === "cashier") {
        router.push("/cashier");
      } else {
        router.push("/tenant-admin");
      }
    } catch (error) {
      setIsLoading(false);
      setAlertModal({
        isOpen: true,
        title: "Login Gagal",
        message: error instanceof Error ? error.message : "Login gagal. Silakan coba lagi.",
        variant: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 mb-4">
            <LogIn className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Masuk ke Dashboard</h1>
          <p className="text-sm text-slate-600">
            Masuk untuk mengelola menu, pesanan, dan laporan kafe Anda
          </p>
        </div>

        {/* Demo Info Card */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-1 text-sm">Coba Fitur Lengkap dengan Demo Account</h3>
              <p className="text-xs text-emerald-800">
                Test semua fitur: kelola menu, generate QR meja, dashboard kasir, laporan penjualan, dan flow pemesanan lengkap
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className={cn(
                    "w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm transition focus:border-emerald-500 focus:bg-white focus:outline-none",
                    errors.email ? "border-rose-300" : "border-slate-200"
                  )}
                  placeholder="admin@kafe.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-600">Ingat saya</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Lupa password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center justify-center gap-2",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs font-semibold text-slate-500 uppercase">atau</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Demo Account Button */}
          <button
            type="button"
            onClick={handleDemoFill}
            className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-300 flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Coba dengan Demo Account
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Klik tombol di atas untuk mengisi email & password demo secara otomatis
          </p>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs font-semibold text-slate-500 uppercase">atau</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Belum punya akun?{" "}
              <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Daftar sekarang
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
    </div>
  );
}

