"use client";

import { X, ArrowUpRight, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  limitType?: "max_menus" | "max_users" | "max_tables" | "max_categories";
  currentCount?: number;
  maxLimit?: number;
  planName?: string;
};

export function UpgradeModal({
  isOpen,
  onClose,
  title,
  message,
  limitType,
  currentCount,
  maxLimit,
  planName,
}: UpgradeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push("/tenant-admin/subscription");
  };

  const getLimitLabel = () => {
    switch (limitType) {
      case "max_menus":
        return "Menu";
      case "max_users":
        return "User";
      case "max_tables":
        return "Meja";
      case "max_categories":
        return "Kategori";
      default:
        return "Fitur";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {title || "Limit Paket Tercapai"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800 font-semibold mb-2">
              ⚠️ Paket {planName || "Anda"} Sudah Mencapai Limit
            </p>
            <p className="text-sm text-amber-700 mb-3">{message}</p>
            
            {currentCount !== undefined && maxLimit !== undefined && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-700">
                  <span>Penggunaan {getLimitLabel()}:</span>
                  <span className="font-semibold">
                    {currentCount} / {maxLimit}
                  </span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (currentCount / maxLimit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-sm font-semibold text-emerald-900 mb-2">
              💡 Solusi
            </p>
            <p className="text-sm text-emerald-700">
              Upgrade ke paket yang lebih tinggi untuk mendapatkan limit yang lebih besar dan fitur tambahan lainnya.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Nanti Saja
            </button>
            <button
              type="button"
              onClick={handleUpgrade}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Upgrade Paket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

