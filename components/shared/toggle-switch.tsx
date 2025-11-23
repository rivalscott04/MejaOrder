"use client";

import { cn } from "@/lib/utils";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
};

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
}: ToggleSwitchProps) {
  const sizes = {
    sm: {
      track: "h-5 w-9",
      thumb: "h-4 w-4",
      translate: "translate-x-4",
    },
    md: {
      track: "h-6 w-11",
      thumb: "h-5 w-5",
      translate: "translate-x-5",
    },
    lg: {
      track: "h-7 w-13",
      thumb: "h-6 w-6",
      translate: "translate-x-6",
    },
  };

  const sizeClasses = sizes[size];

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={cn(
            "relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2",
            sizeClasses.track,
            checked ? "bg-emerald-500" : "bg-slate-300",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out",
              sizeClasses.thumb,
              checked ? sizeClasses.translate : "translate-x-0.5"
            )}
          />
        </div>
      </div>
      {label && (
        <span className={cn("text-sm font-semibold", checked ? "text-slate-900" : "text-slate-600")}>
          {label}
        </span>
      )}
    </label>
  );
}

