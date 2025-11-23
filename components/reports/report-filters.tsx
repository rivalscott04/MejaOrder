"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterOption = {
  value: string;
  label: string;
};

type ReportFiltersProps = {
  categories?: FilterOption[];
  paymentMethods?: FilterOption[];
  orderStatuses?: FilterOption[];
  paymentStatuses?: FilterOption[];
  tables?: FilterOption[];
  onFilterChange?: (filters: ReportFiltersState) => void;
  className?: string;
};

export type ReportFiltersState = {
  category?: string;
  paymentMethod?: string;
  orderStatus?: string;
  paymentStatus?: string;
  table?: string;
  search?: string;
};

export function ReportFilters({
  categories = [],
  paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "transfer", label: "Transfer" },
    { value: "qris", label: "QRIS" },
  ],
  orderStatuses = [
    { value: "pending", label: "Menunggu" },
    { value: "accepted", label: "Diterima" },
    { value: "preparing", label: "Sedang Disiapkan" },
    { value: "ready", label: "Siap" },
    { value: "completed", label: "Selesai" },
    { value: "canceled", label: "Dibatalkan" },
  ],
  paymentStatuses = [
    { value: "unpaid", label: "Belum Bayar" },
    { value: "waiting_verification", label: "Menunggu Verifikasi" },
    { value: "paid", label: "Lunas" },
    { value: "failed", label: "Gagal" },
    { value: "refunded", label: "Refund" },
  ],
  tables = [],
  onFilterChange,
  className,
}: ReportFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ReportFiltersState>({});

  const handleFilterChange = (key: keyof ReportFiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: ReportFiltersState = {};
    setFilters(emptyFilters);
    onFilterChange?.(emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Hapus Filter
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Cari</label>
            <input
              type="text"
              placeholder="Kode pesanan, meja..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Kategori</label>
              <select
                value={filters.category || ""}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method Filter */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Metode Pembayaran</label>
            <select
              value={filters.paymentMethod || ""}
              onChange={(e) => handleFilterChange("paymentMethod", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Semua Metode</option>
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Order Status Filter */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status Pesanan</label>
            <select
              value={filters.orderStatus || ""}
              onChange={(e) => handleFilterChange("orderStatus", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Semua Status</option>
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status Pembayaran</label>
            <select
              value={filters.paymentStatus || ""}
              onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Semua Status</option>
              {paymentStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Table Filter */}
          {tables.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Meja</label>
              <select
                value={filters.table || ""}
                onChange={(e) => handleFilterChange("table", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Semua Meja</option>
                {tables.map((table) => (
                  <option key={table.value} value={table.value}>
                    {table.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

