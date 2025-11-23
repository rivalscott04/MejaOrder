"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ClipboardList } from "lucide-react";
import { TableSkeleton } from "@/components/shared/menu-skeleton";

export default function OrdersPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout role="tenant-admin" userEmail="admin@brewhaven.id" userName="Admin BrewHaven">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Pesanan</h1>
          <p className="mt-2 text-sm text-slate-600">Monitor dan kelola pesanan masuk</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-16 w-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Halaman Pesanan</h3>
              <p className="text-sm text-slate-600">Fitur ini akan segera hadir</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

