"use client";

import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

type AlertModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  buttonLabel?: string;
};

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  variant = "info",
  buttonLabel = "Mengerti",
}: AlertModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      button: "bg-emerald-500 hover:bg-emerald-600",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-red-600",
      iconBg: "bg-red-50",
      button: "bg-red-500 hover:bg-red-600",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      button: "bg-amber-500 hover:bg-amber-600",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      button: "bg-blue-500 hover:bg-blue-600",
    },
  };

  const styles = variantStyles[variant];
  const IconComponent = styles.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${styles.iconBg}`}>
              <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-600 whitespace-pre-line">{message}</p>

        <button
          onClick={onClose}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${styles.button}`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

