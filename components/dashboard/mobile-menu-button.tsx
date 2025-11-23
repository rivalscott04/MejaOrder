"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileMenuButtonProps = {
  onClick: () => void;
  className?: string;
};

export function MobileMenuButton({ onClick, className }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-slate-200 shadow-md text-slate-600 hover:bg-slate-50 transition",
        className
      )}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

