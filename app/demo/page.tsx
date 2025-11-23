"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LogIn, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/shared/alert-modal";
import { login } from "@/lib/api-client";

export default function DemoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<"admin" | "cashier">("admin");
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

  const demoAccounts = {
    admin: {
      email: "demo@orderapp.test",
      password: "demo123",
      role: "Tenant Admin",
      description: "Akses penuh untuk mengelola menu, meja, pengguna, dan laporan",
    },
    cashier: {
      email: "kasir@demo.test",
      password: "demo123",
      role: "Kasir",
      description: "Dashboard kasir untuk melihat dan mengelola pesanan",
    },
  };

  const handleQuickLogin = async () => {
    setIsLoading(true);
    try {
      const account = demoAccounts[selectedAccount];
      const response = await login({
        email: account.email,
        password: account.password,
        remember: false,
      });

      // Redirect based on role
      if (response.user.role === "cashier") {
        router.push("/cashier");
      } else {
        router.push("/tenant-admin");
      }
    } catch (error) {
      setIsLoading(false);
      let errorMessage = "Login gagal. Silakan coba lagi.";
      let variant: "success" | "error" | "warning" | "info" = "error";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for network/CORS errors
        if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.includes("CORS")) {
          errorMessage = "Tidak dapat terhubung ke backend. Pastikan:\n\n1. Backend Laravel berjalan di http://localhost:8000\n2. Jalankan: php artisan serve\n3. Pastikan NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 di .env.local";
          variant = "warning";
        } else if (errorMessage.includes("Backend URL not configured")) {
          errorMessage = "Backend URL belum dikonfigurasi. Pastikan file .env.local berisi:\n\nNEXT_PUBLIC_BACKEND_URL=http://localhost:8000";
          variant = "warning";
        } else if (errorMessage.includes("Email atau password salah") || errorMessage.includes("401")) {
          errorMessage = "Akun demo belum tersedia di database. Silakan jalankan seeder:\n\nphp artisan db:seed --class=DemoAccountSeeder";
          variant = "warning";
        }
      }
      
      setAlertModal({
        isOpen: true,
        title: variant === "warning" ? "Perhatian" : "Login Gagal",
        message: errorMessage,
        variant,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 mb-4">
            <Sparkles className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Demo Account</h1>
          <p className="text-sm text-slate-600">
            Coba sistem MejaOrder dengan akun demo. Tidak perlu registrasi, langsung login dan explore fitur-fitur lengkap!
          </p>
        </div>

        {/* Demo Info Card */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-1">Apa yang bisa Anda coba?</h3>
              <ul className="text-sm text-emerald-800 space-y-1">
                <li>• Kelola menu dengan variasi (size, temperature, topping)</li>
                <li>• Generate QR code untuk meja</li>
                <li>• Lihat dashboard kasir real-time</li>
                <li>• Test flow pemesanan dari QR scan hingga pembayaran</li>
                <li>• Lihat laporan penjualan dan statistik</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Account Selection */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pilih Akun Demo</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={() => setSelectedAccount("admin")}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition",
                  selectedAccount === "admin"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                      selectedAccount === "admin"
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300"
                    )}
                  >
                    {selectedAccount === "admin" && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="font-semibold text-slate-900">Tenant Admin</span>
                </div>
                <p className="text-xs text-slate-600">{demoAccounts.admin.description}</p>
              </button>

              <button
                onClick={() => setSelectedAccount("cashier")}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition",
                  selectedAccount === "cashier"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                      selectedAccount === "cashier"
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300"
                    )}
                  >
                    {selectedAccount === "cashier" && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="font-semibold text-slate-900">Kasir</span>
                </div>
                <p className="text-xs text-slate-600">{demoAccounts.cashier.description}</p>
              </button>
            </div>
          </div>

          {/* Credentials Display */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Kredensial Demo</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-mono text-slate-700">{demoAccounts[selectedAccount].email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-mono text-slate-700">{demoAccounts[selectedAccount].password}</span>
              </div>
            </div>
          </div>

          {/* Quick Login Button */}
          <button
            onClick={handleQuickLogin}
            disabled={isLoading}
            className={cn(
              "w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center justify-center gap-2",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              "Memproses..."
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Login dengan Akun Demo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              Kembali ke Beranda
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-900">
              Login dengan Akun Sendiri
            </Link>
            <span>•</span>
            <Link href="/register" className="hover:text-slate-900">
              Daftar Akun Baru
            </Link>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-800">
            <strong>Catatan:</strong> Akun demo ini hanya untuk testing dan demo. Data yang dibuat di akun demo mungkin akan di-reset secara berkala. Untuk penggunaan production, silakan daftar akun baru.
          </p>
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

