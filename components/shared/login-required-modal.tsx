"use client";

import { useRouter } from "next/navigation";
import { LogIn, ArrowLeft } from "lucide-react";
import Link from "next/link";

type LoginRequiredModalProps = {
  isOpen: boolean;
};

export function LoginRequiredModal({ isOpen }: LoginRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleBack = () => {
    // Redirect to home/landing page instead of going back
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-full bg-amber-100 p-3">
            <LogIn className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        
        <h2 className="mb-2 text-center text-xl font-bold text-slate-900">
          Login Diperlukan
        </h2>
        
        <p className="mb-6 text-center text-sm text-slate-600">
          Anda harus login atau masuk terlebih dahulu untuk mengakses halaman ini.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <LogIn className="h-4 w-4" />
            Login / Masuk
          </Link>
          
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}

