"use client";

import { Menu } from "lucide-react";

type TopBarProps = {
  onMenuClick: () => void;
  role: "super-admin" | "tenant-admin" | "cashier";
};

export function TopBar({ onMenuClick, role }: TopBarProps) {
  const roleLabels: Record<typeof role, string> = {
    "super-admin": "Super Admin",
    "tenant-admin": "Tenant Admin",
    cashier: "Kasir",
  };

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider truncate">
          {roleLabels[role]}
        </p>
      </div>
    </div>
  );
}

