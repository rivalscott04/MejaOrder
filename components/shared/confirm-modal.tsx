"use client";

import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  extraButton?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "warning",
  isLoading = false,
  extraButton,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const variantStyles = {
    danger: {
      icon: "text-red-600",
      iconBg: "bg-red-50",
      button: "bg-red-500 hover:bg-red-600",
    },
    warning: {
      icon: "text-amber-600",
      iconBg: "bg-amber-50",
      button: "bg-amber-500 hover:bg-amber-600",
    },
    info: {
      icon: "text-blue-600",
      iconBg: "bg-blue-50",
      button: "bg-blue-500 hover:bg-blue-600",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${styles.iconBg}`}>
              <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-600 whitespace-pre-line">{message}</p>

        <div className={cn("flex gap-3", extraButton ? "flex-col" : "flex-row")}>
          {extraButton && (
            <button
              onClick={extraButton.onClick}
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed",
                extraButton.variant === "primary"
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "border-2 border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
              )}
            >
              {extraButton.label}
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
            >
              {isLoading ? "Memproses..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

