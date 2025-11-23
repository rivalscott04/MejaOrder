"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastProps = {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  variant?: "success" | "error" | "info";
  duration?: number;
};

export function Toast({
  isOpen,
  onClose,
  message,
  variant = "success",
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-900",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
    },
    info: {
      icon: CheckCircle2,
      iconColor: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
    },
  };

  const styles = variantStyles[variant];
  const IconComponent = styles.icon;

  return (
    <div className="fixed top-4 right-4 z-50" style={{ animation: 'slideIn 0.3s ease-out' }}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg",
          styles.bg,
          styles.border
        )}
      >
        <IconComponent className={cn("h-5 w-5 flex-shrink-0", styles.iconColor)} />
        <p className={cn("text-sm font-medium", styles.text)}>{message}</p>
        <button
          onClick={onClose}
          className={cn(
            "ml-2 rounded-lg p-1 transition hover:bg-black/10",
            styles.text
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

