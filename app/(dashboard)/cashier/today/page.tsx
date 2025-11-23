"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { fetchOrders, getCurrentUser, type Order, type LoginResponse } from "@/lib/api-client";
import { currencyFormatter, formatTime, cn, formatOrderCode } from "@/lib/utils";
import { TrendingUp, DollarSign, Package, CheckCircle2, AlertCircle, Calendar, ChevronDown, ChevronUp, ShoppingBag, CreditCard } from "lucide-react";
import { StatsGridSkeleton } from "@/components/shared/menu-skeleton";
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge";

type PeriodFilter = "today" | "this_week" | "this_month" | "custom";
type PaymentMethod = "all" | "cash" | "transfer" | "qris";
type OrderStatus = "all" | "pending" | "accepted" | "preparing" | "ready" | "completed" | "canceled";

export default function CashierStatisticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("today");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("all");
  const [showOrderStatusDetails, setShowOrderStatusDetails] = useState(true);
  const [showPaymentStatusDetails, setShowPaymentStatusDetails] = useState(true);

  // Fetch user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await getCurrentUser();
        setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    loadUserData();
  }, []);

  // Get date range based on period filter
  const getDateRange = (period: PeriodFilter): { date_from: string; date_to: string } => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const todayEnd = new Date(today);

    let dateFrom: Date;
    let dateTo: Date = todayEnd;

    switch (period) {
      case "today":
        dateFrom = new Date(today);
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case "this_week":
        dateFrom = new Date(today);
        dateFrom.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case "this_month":
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFrom.setHours(0, 0, 0, 0);
        break;
      default:
        dateFrom = new Date(today);
        dateFrom.setHours(0, 0, 0, 0);
    }

    return {
      date_from: dateFrom.toISOString().split("T")[0],
      date_to: dateTo.toISOString().split("T")[0],
    };
  };

  // Fetch orders based on period
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const { date_from, date_to } = getDateRange(periodFilter);
      const params: { date_from?: string; date_to?: string; all?: boolean } = {
        date_from,
        date_to,
        all: true, // Get all orders without pagination for statistics
      };

      const response = await fetchOrders(params);
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [periodFilter]);

  useEffect(() => {
    loadOrders();
    // Polling every 10 seconds
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Filter orders by payment method
  const ordersByPaymentMethod = selectedPaymentMethod === "all"
    ? orders
    : orders.filter((o) => o.payment_method === selectedPaymentMethod);

  // Calculate stats based on filtered orders (by payment method)
  // Revenue should only count orders that are both paid AND completed
  const completedAndPaidOrders = ordersByPaymentMethod.filter(
    (o) => o.payment_status === "paid" && o.order_status === "completed"
  );
  const paidOrders = ordersByPaymentMethod.filter((o) => o.payment_status === "paid");
  const stats = {
    total: ordersByPaymentMethod.length,
    revenue: completedAndPaidOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
    completed: ordersByPaymentMethod.filter((o) => o.order_status === "completed").length,
    pending: ordersByPaymentMethod.filter((o) => o.order_status === "pending").length,
    accepted: ordersByPaymentMethod.filter((o) => o.order_status === "accepted").length,
    preparing: ordersByPaymentMethod.filter((o) => o.order_status === "preparing").length,
    ready: ordersByPaymentMethod.filter((o) => o.order_status === "ready").length,
    canceled: ordersByPaymentMethod.filter((o) => o.order_status === "canceled").length,
    paid: paidOrders.length,
    unpaid: ordersByPaymentMethod.filter((o) => o.payment_status === "unpaid").length,
    waitingVerification: ordersByPaymentMethod.filter((o) => o.payment_status === "waiting_verification").length,
  };

  // Filter orders by status (applied after payment method filter)
  const filteredOrders = selectedStatus === "all" 
    ? ordersByPaymentMethod 
    : ordersByPaymentMethod.filter((o) => o.order_status === selectedStatus);

  const getPeriodLabel = (period: PeriodFilter): string => {
    switch (period) {
      case "today":
        return "Hari Ini";
      case "this_week":
        return "Minggu Ini";
      case "this_month":
        return "Bulan Ini";
      default:
        return "Hari Ini";
    }
  };

  return (
    <DashboardLayout role="cashier" userEmail={userData?.user.email} userName={userData?.user.name}>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Statistik</h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
            Ringkasan dan statistik pesanan berdasarkan periode
          </p>
        </div>

        {/* Period Filter */}
        <div className="mb-4 sm:mb-5 lg:mb-6 flex flex-wrap gap-2">
          {(["today", "this_week", "this_month"] as PeriodFilter[]).map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                periodFilter === period
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>

        {/* Main Stats Cards */}
        {isLoading ? (
          <StatsGridSkeleton count={3} />
        ) : (
          <div className="mb-4 sm:mb-5 lg:mb-6 grid gap-2.5 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-3">
            <StatCard
              label="Total Pesanan"
              value={stats.total.toString()}
              icon={<Package className="h-5 w-5" />}
            />
            <StatCard
              label="Pendapatan"
              value={currencyFormatter.format(stats.revenue)}
              icon={<DollarSign className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              label="Pending Verifikasi"
              value={stats.waitingVerification.toString()}
              icon={<AlertCircle className="h-5 w-5" />}
              variant="warning"
            />
          </div>
        )}

        {/* Status Breakdown - Grouped by Category */}
        <div className="mb-4 sm:mb-5 lg:mb-6 space-y-4">
          {/* Order Status Section */}
          <div className="rounded-xl lg:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 lg:p-5 shadow-sm">
            <button
              onClick={() => setShowOrderStatusDetails(!showOrderStatusDetails)}
              className="w-full flex items-center justify-between mb-3 sm:mb-4"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Status Pesanan</h3>
                  <p className="text-xs text-slate-500">Ringkasan status pesanan</p>
                </div>
              </div>
              {showOrderStatusDetails ? (
                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              )}
            </button>
            {showOrderStatusDetails && (
              <div className="grid gap-2.5 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <StatusCard label="Diterima" count={stats.accepted} />
                <StatusCard label="Sedang Disiapkan" count={stats.preparing} />
                <StatusCard label="Siap" count={stats.ready} />
                <StatusCard label="Selesai" count={stats.completed} variant="success" />
                <StatusCard label="Dibatalkan" count={stats.canceled} variant="danger" />
              </div>
            )}
          </div>

          {/* Payment Status Section */}
          <div className="rounded-xl lg:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 lg:p-5 shadow-sm">
            <button
              onClick={() => setShowPaymentStatusDetails(!showPaymentStatusDetails)}
              className="w-full flex items-center justify-between mb-3 sm:mb-4"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Status Pembayaran</h3>
                  <p className="text-xs text-slate-500">Ringkasan status pembayaran</p>
                </div>
              </div>
              {showPaymentStatusDetails ? (
                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              )}
            </button>
            {showPaymentStatusDetails && (
              <div className="grid gap-2.5 sm:gap-3 grid-cols-2 lg:grid-cols-2">
                <StatusCard label="Lunas" count={stats.paid} variant="success" />
                <StatusCard label="Belum Lunas" count={stats.unpaid} variant="warning" />
              </div>
            )}
          </div>
        </div>

        {/* Filter and Orders List */}
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 lg:p-6 shadow-sm">
          {/* Filters Row */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            {/* Payment Method Filter - Dropdown for desktop, buttons for mobile */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Metode Pembayaran</label>
              
              {/* Desktop: Dropdown */}
              <div className="relative hidden lg:block">
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">Semua Metode</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Mobile: Buttons */}
              <div className="flex flex-wrap gap-2 lg:hidden">
                {(["all", "cash", "transfer", "qris"] as PaymentMethod[]).map((method) => {
                  const methodLabels: Record<string, string> = {
                    all: "Semua",
                    cash: "Cash",
                    transfer: "Transfer",
                    qris: "QRIS",
                  };
                  return (
                    <button
                      key={method}
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        selectedPaymentMethod === method
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {methodLabels[method] || method}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Status Filter - Dropdown for desktop, buttons for mobile */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status Pesanan</label>
              
              {/* Desktop: Dropdown */}
              <div className="relative hidden lg:block">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Menunggu</option>
                  <option value="accepted">Diterima</option>
                  <option value="preparing">Sedang Disiapkan</option>
                  <option value="ready">Siap</option>
                  <option value="completed">Selesai</option>
                  <option value="canceled">Dibatalkan</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Mobile: Buttons */}
              <div className="flex flex-wrap gap-2 lg:hidden">
                {(["all", "pending", "accepted", "preparing", "ready", "completed", "canceled"] as OrderStatus[]).map((status) => {
                  const statusLabels: Record<string, string> = {
                    all: "Semua",
                    pending: "Menunggu",
                    accepted: "Diterima",
                    preparing: "Sedang Disiapkan",
                    ready: "Siap",
                    completed: "Selesai",
                    canceled: "Dibatalkan",
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        selectedStatus === status
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {statusLabels[status] || status}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">Memuat data...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">Tidak ada pesanan</div>
          ) : (
            <>
              {/* Mobile/Tablet: Card View */}
              <div className="block lg:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-slate-500">{formatTime(order.created_at)}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="font-semibold text-slate-900">Meja {order.table?.number || "-"}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600 font-mono">{formatOrderCode(order.order_code)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={order.order_status} />
                          <PaymentStatusBadge status={order.payment_status} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-slate-900">
                          {currencyFormatter.format(parseFloat(order.total_amount))}
                        </p>
                        <div className="mt-1">
                          <PaymentMethodBadge method={order.payment_method} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table View with Index */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="pb-3 w-12">No</th>
                      <th className="pb-3">Waktu</th>
                      <th className="pb-3">Meja</th>
                      <th className="pb-3">Kode</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Status Pembayaran</th>
                      <th className="pb-3">Metode</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order, index) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="py-3 text-slate-500 font-medium">{index + 1}</td>
                        <td className="py-3 text-slate-600">{formatTime(order.created_at)}</td>
                        <td className="py-3 font-semibold text-slate-900">Meja {order.table?.number || "-"}</td>
                        <td className="py-3 text-slate-600 font-mono">{formatOrderCode(order.order_code)}</td>
                        <td className="py-3">
                          <StatusBadge status={order.order_status} />
                        </td>
                        <td className="py-3">
                          <PaymentStatusBadge status={order.payment_status} />
                        </td>
                        <td className="py-3">
                          <PaymentMethodBadge method={order.payment_method} />
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {currencyFormatter.format(parseFloat(order.total_amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning";
}) {
  const bgColors = {
    default: "bg-white border-slate-200",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
  };
  const textColors = {
    default: "text-slate-900",
    success: "text-emerald-700",
    warning: "text-amber-700",
  };
  const iconColors = {
    default: "text-slate-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
  };

  return (
    <div className={`rounded-xl lg:rounded-2xl border p-3 sm:p-4 lg:p-6 ${bgColors[variant]}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <div className={cn(iconColors[variant], "scale-90 sm:scale-100")}>{icon}</div>
      </div>
      <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${textColors[variant]}`}>{value}</p>
    </div>
  );
}

function StatusCard({
  label,
  count,
  variant = "default",
}: {
  label: string;
  count: number;
  variant?: "default" | "success" | "danger" | "warning";
}) {
  const bgColors = {
    default: "bg-slate-50 border-slate-200",
    success: "bg-emerald-50 border-emerald-200",
    danger: "bg-rose-50 border-rose-200",
    warning: "bg-amber-50 border-amber-200",
  };
  const textColors = {
    default: "text-slate-700",
    success: "text-emerald-700",
    danger: "text-rose-700",
    warning: "text-amber-700",
  };

  return (
    <div className={`rounded-xl border p-3 ${bgColors[variant]}`}>
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${textColors[variant]}`}>{count}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-slate-100 text-slate-700",
    accepted: "bg-amber-100 text-amber-700",
    preparing: "bg-amber-100 text-amber-700",
    ready: "bg-emerald-100 text-emerald-700",
    completed: "bg-emerald-200 text-emerald-800",
    canceled: "bg-rose-100 text-rose-700",
  };
  const statusLabels: Record<string, string> = {
    pending: "Menunggu",
    accepted: "Diterima",
    preparing: "Sedang Disiapkan",
    ready: "Siap",
    completed: "Selesai",
    canceled: "Dibatalkan",
  };
  return (
    <span className={cn("rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold whitespace-nowrap", variants[status] ?? "bg-slate-100 text-slate-700")}>
      {statusLabels[status] || status}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    unpaid: "bg-slate-100 text-slate-700",
    waiting_verification: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
  };
  const statusLabels: Record<string, string> = {
    unpaid: "Belum Lunas",
    waiting_verification: "Menunggu Verifikasi",
    paid: "Lunas",
    failed: "Gagal",
  };
  return (
    <span className={cn("rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold whitespace-nowrap", variants[status] ?? "bg-slate-100 text-slate-700")}>
      {statusLabels[status] || status.replace("_", " ")}
    </span>
  );
}
