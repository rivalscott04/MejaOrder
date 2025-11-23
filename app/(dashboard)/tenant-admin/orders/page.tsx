"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { cn, currencyFormatter, formatTime, formatOrderCode } from "@/lib/utils";
import {
  fetchOrders,
  fetchCompletedOrders,
  fetchOrderDetail,
  getCurrentUser,
  fetchTenantSettings,
  type Order,
  type LoginResponse,
  type TenantSettings,
} from "@/lib/api-client";
import {
  ClipboardList,
  Search,
  Calendar,
  Printer,
  Eye,
  Loader2,
  ChevronDown,
  FileText,
  Filter,
} from "lucide-react";
import { OrderTableSkeleton } from "@/components/shared/menu-skeleton";
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge";
import { AlertModal } from "@/components/shared/alert-modal";
import { Toast } from "@/components/shared/toast";
import { InvoicePrinter } from "@/components/tenant/invoice-printer";
import { WifiInputModal } from "@/components/tenant/wifi-input-modal";
import { OrderDetailView } from "@/components/cashier/order-detail-view";

type PeriodFilter = "today" | "yesterday" | "this_week" | "this_month" | "all";
type OrderStatusFilter = "all" | "pending" | "accepted" | "preparing" | "ready" | "completed";
type PaymentStatusFilter = "all" | "unpaid" | "waiting_verification" | "paid";

export default function OrdersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [isWifiModalOpening, setIsWifiModalOpening] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [wifiData, setWifiData] = useState<{ wifiName: string; wifiPassword: string }>({
    wifiName: "",
    wifiPassword: "",
  });
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
  });
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    variant: "success" | "error" | "info";
  }>({
    isOpen: false,
    message: "",
    variant: "success",
  });

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

  // Fetch tenant settings
  useEffect(() => {
    const loadTenantSettings = async () => {
      try {
        const settings = await fetchTenantSettings();
        setTenantSettings(settings);
      } catch (error) {
        console.error("Failed to fetch tenant settings:", error);
      }
    };
    loadTenantSettings();
  }, []);

  // Get date range based on period filter
  const getDateRange = (period: PeriodFilter): { date_from?: string; date_to?: string } => {
    if (period === "all") {
      return {};
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayEnd = new Date(today);

    let dateFrom: Date;
    let dateTo: Date = todayEnd;

    switch (period) {
      case "today":
        dateFrom = new Date(today);
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        dateFrom = new Date(today);
        dateFrom.setDate(today.getDate() - 1);
        dateFrom.setHours(0, 0, 0, 0);
        dateTo = new Date(dateFrom);
        dateTo.setHours(23, 59, 59, 999);
        break;
      case "this_week":
        dateFrom = new Date(today);
        dateFrom.setDate(today.getDate() - today.getDay());
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case "this_month":
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFrom.setHours(0, 0, 0, 0);
        break;
      default:
        return {};
    }

    return {
      date_from: dateFrom.toISOString().split("T")[0],
      date_to: dateTo.toISOString().split("T")[0],
    };
  };

  // Fetch orders
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const { date_from, date_to } = getDateRange(periodFilter);
      
      // Build params for incomplete orders
      const incompleteParams: {
        date_from?: string;
        date_to?: string;
        order_status?: string;
        payment_status?: string;
        all?: boolean;
      } = {
        all: true,
      };

      if (date_from) incompleteParams.date_from = date_from;
      if (date_to) incompleteParams.date_to = date_to;
      if (paymentStatusFilter !== "all") incompleteParams.payment_status = paymentStatusFilter;
      
      // Only apply order_status filter if it's not "completed" or "all"
      // because completed orders are fetched separately
      if (orderStatusFilter !== "all" && orderStatusFilter !== "completed") {
        incompleteParams.order_status = orderStatusFilter;
      }

      // Build params for completed orders
      const completedParams: {
        date_from?: string;
        date_to?: string;
        payment_status?: string;
        all?: boolean;
      } = {
        all: true,
      };

      if (date_from) completedParams.date_from = date_from;
      if (date_to) completedParams.date_to = date_to;
      if (paymentStatusFilter !== "all") completedParams.payment_status = paymentStatusFilter;

      // Fetch both incomplete and completed orders in parallel
      const [incompleteResponse, completedResponse] = await Promise.all([
        fetchOrders(incompleteParams).catch(() => ({ data: [] })),
        // Only fetch completed orders if filter is "all" or "completed"
        (orderStatusFilter === "all" || orderStatusFilter === "completed")
          ? fetchCompletedOrders(completedParams).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      // Combine both results
      const allOrders = [...incompleteResponse.data, ...completedResponse.data];
      
      // Remove duplicates (in case there's any overlap)
      const uniqueOrders = allOrders.filter(
        (order, index, self) => index === self.findIndex((o) => o.id === order.id)
      );

      // Sort by created_at descending (newest first)
      uniqueOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(uniqueOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setAlertModal({
        isOpen: true,
        title: "Gagal Memuat Data",
        message: "Tidak dapat memuat data pesanan. Silakan coba lagi nanti.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [periodFilter, orderStatusFilter, paymentStatusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Load order detail when selected
  useEffect(() => {
    if (selectedOrderId) {
      const loadDetail = async () => {
        try {
          const order = await fetchOrderDetail(selectedOrderId);
          setSelectedOrder(order);
        } catch (error) {
          console.error("Failed to fetch order detail:", error);
          setAlertModal({
            isOpen: true,
            title: "Gagal Memuat Detail",
            message: "Tidak dapat memuat detail pesanan. Silakan coba lagi.",
            variant: "error",
          });
        }
      };
      loadDetail();
    } else {
      setSelectedOrder(null);
    }
  }, [selectedOrderId]);

  // Filter orders by search query
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table?.number?.includes(searchQuery) ||
      (order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  // Handle print invoice
  const handlePrintInvoice = async (order: Order) => {
    // Prevent double trigger
    if (showWifiModal || isWifiModalOpening || showInvoice || isPrinting) {
      return;
    }

    if (order.payment_status !== "paid") {
      setAlertModal({
        isOpen: true,
        title: "Tidak Dapat Mencetak",
        message: "Invoice hanya dapat dicetak untuk pesanan yang sudah lunas.",
        variant: "warning",
      });
      return;
    }

    // Ensure we have all required data
    if (!tenantSettings) {
      setAlertModal({
        isOpen: true,
        title: "Data Belum Siap",
        message: "Data tenant belum dimuat. Silakan tunggu sebentar dan coba lagi.",
        variant: "error",
      });
      return;
    }

    if (!order.items || order.items.length === 0) {
      setAlertModal({
        isOpen: true,
        title: "Data Tidak Lengkap",
        message: "Pesanan tidak memiliki item. Tidak dapat mencetak invoice.",
        variant: "error",
      });
      return;
    }

    // Set printing order and show loading cursor
    setPrintingOrder(order);
    setIsPrinting(true);
    setIsWifiModalOpening(true);
    setShowWifiModal(true);
  };

  // Handle WiFi confirmation
  const handleWifiConfirm = (wifiName: string, wifiPassword: string) => {
    setWifiData({ wifiName, wifiPassword });
    setShowWifiModal(false);
    setIsWifiModalOpening(false);
    // Show invoice after WiFi data is confirmed
    setShowInvoice(true);
  };

  // Handle invoice print complete
  const handleInvoicePrintComplete = () => {
    setShowInvoice(false);
    setIsPrinting(false);
    // Reset WiFi data and printing order
    setWifiData({ wifiName: "", wifiPassword: "" });
    setPrintingOrder(null);
    setToast({
      isOpen: true,
      message: "Invoice berhasil dicetak",
      variant: "success",
    });
  };

  // Handle cursor behavior when printing
  useEffect(() => {
    if (isPrinting) {
      document.body.style.cursor = "wait";
      document.documentElement.style.cursor = "wait";
    } else {
      document.body.style.cursor = "";
      document.documentElement.style.cursor = "";
    }
    return () => {
      document.body.style.cursor = "";
      document.documentElement.style.cursor = "";
    };
  }, [isPrinting]);

  const getPeriodLabel = (period: PeriodFilter): string => {
    switch (period) {
      case "today":
        return "Hari Ini";
      case "yesterday":
        return "Kemarin";
      case "this_week":
        return "Minggu Ini";
      case "this_month":
        return "Bulan Ini";
      case "all":
        return "Semua";
      default:
        return "Semua";
    }
  };

  const getOrderStatusLabel = (status: string): string => {
    switch (status) {
      case "pending":
        return "Menunggu";
      case "accepted":
        return "Diterima";
      case "preparing":
        return "Disiapkan";
      case "ready":
        return "Siap";
      case "completed":
        return "Selesai";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string): string => {
    switch (status) {
      case "unpaid":
        return "Belum Bayar";
      case "waiting_verification":
        return "Menunggu Verifikasi";
      case "paid":
        return "Lunas";
      default:
        return status;
    }
  };

  const getOrderStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "accepted":
        return "bg-blue-100 text-blue-700";
      case "preparing":
        return "bg-purple-100 text-purple-700";
      case "ready":
        return "bg-emerald-100 text-emerald-700";
      case "completed":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case "unpaid":
        return "bg-red-100 text-red-700";
      case "waiting_verification":
        return "bg-amber-100 text-amber-700";
      case "paid":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const displayName = userData?.user.name || "Admin";
  const displayEmail = userData?.user.email || "";

  return (
    <DashboardLayout role="tenant-admin" userEmail={displayEmail} userName={displayName}>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-emerald-100 p-2">
              <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Pesanan</h1>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
            Monitor dan kelola semua pesanan masuk
          </p>
        </div>

        {/* Period Filter */}
        <div className="mb-4 sm:mb-5 lg:mb-6 flex flex-wrap gap-2">
          {(["today", "yesterday", "this_week", "this_month", "all"] as PeriodFilter[]).map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                periodFilter === period
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="mb-4 sm:mb-5 lg:mb-6 rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Cari Pesanan</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode pesanan, nomor meja, atau nama pelanggan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Status Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Order Status Filter */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status Pesanan</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatusFilter)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="accepted">Diterima</option>
                    <option value="preparing">Disiapkan</option>
                    <option value="ready">Siap</option>
                    <option value="completed">Selesai</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status Pembayaran</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value as PaymentStatusFilter)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="all">Semua Status</option>
                    <option value="unpaid">Belum Bayar</option>
                    <option value="waiting_verification">Menunggu Verifikasi</option>
                    <option value="paid">Lunas</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 lg:p-6 shadow-sm">
          {isLoading ? (
            <OrderTableSkeleton rows={5} />
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600 mb-1">Tidak Ada Pesanan</p>
              <p className="text-xs text-slate-500">
                {searchQuery || orderStatusFilter !== "all" || paymentStatusFilter !== "all"
                  ? "Tidak ada pesanan yang sesuai dengan filter yang dipilih"
                  : "Belum ada pesanan pada periode yang dipilih"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile/Tablet: Card View */}
              <div className="block lg:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs text-slate-500">{formatTime(order.created_at)}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="font-semibold text-slate-900">Meja {order.table?.number || "-"}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600 font-mono">{formatOrderCode(order.order_code)}</span>
                        </div>
                        {order.customer_name && (
                          <p className="text-xs text-slate-700 font-semibold mb-2">{order.customer_name}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <PaymentMethodBadge method={order.payment_method} />
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold",
                              getOrderStatusColor(order.order_status)
                            )}
                          >
                            {getOrderStatusLabel(order.order_status)}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold",
                              getPaymentStatusColor(order.payment_status)
                            )}
                          >
                            {getPaymentStatusLabel(order.payment_status)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-slate-900">
                          {currencyFormatter.format(parseFloat(order.total_amount))}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition flex items-center justify-center gap-2"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Lihat Detail
                      </button>
                      {order.payment_status === "paid" && (
                        <button
                          onClick={() => handlePrintInvoice(order)}
                          disabled={isPrinting}
                          className={cn(
                            "flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait",
                            isPrinting && "cursor-wait"
                          )}
                        >
                          {isPrinting && printingOrder?.id === order.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Mencetak...
                            </>
                          ) : (
                            <>
                              <Printer className="h-3.5 w-3.5" />
                              Cetak Invoice
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="pb-3">Waktu</th>
                      <th className="pb-3">Meja</th>
                      <th className="pb-3">Kode</th>
                      <th className="pb-3">Nama</th>
                      <th className="pb-3">Metode</th>
                      <th className="pb-3">Status Pesanan</th>
                      <th className="pb-3">Status Bayar</th>
                      <th className="pb-3 text-right">Total</th>
                      <th className="pb-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="transition hover:bg-slate-50">
                        <td className="py-3 text-slate-600">{formatTime(order.created_at)}</td>
                        <td className="py-3 font-semibold text-slate-900">Meja {order.table?.number || "-"}</td>
                        <td className="py-3 text-slate-600 font-mono">{formatOrderCode(order.order_code)}</td>
                        <td className="py-3 text-slate-600">{order.customer_name || "-"}</td>
                        <td className="py-3">
                          <PaymentMethodBadge method={order.payment_method} />
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-1 text-xs font-semibold",
                              getOrderStatusColor(order.order_status)
                            )}
                          >
                            {getOrderStatusLabel(order.order_status)}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-1 text-xs font-semibold",
                              getPaymentStatusColor(order.payment_status)
                            )}
                          >
                            {getPaymentStatusLabel(order.payment_status)}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {currencyFormatter.format(parseFloat(order.total_amount))}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedOrderId(order.id)}
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-600 transition"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {order.payment_status === "paid" && (
                              <button
                                onClick={() => handlePrintInvoice(order)}
                                disabled={isPrinting}
                                className={cn(
                                  "p-2 rounded-lg text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 transition disabled:opacity-50",
                                  isPrinting && printingOrder?.id === order.id && "cursor-wait"
                                )}
                                title="Cetak Invoice"
                              >
                                {isPrinting && printingOrder?.id === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Printer className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
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

      {/* Order Detail View */}
      {selectedOrder && (
        <OrderDetailView
          order={selectedOrder}
          onClose={() => {
            setSelectedOrderId(null);
            setSelectedOrder(null);
          }}
          onStatusUpdate={async () => {
            // Reload orders after status update
            await loadOrders();
          }}
          onPaymentUpdate={async () => {
            // Reload orders after payment update
            await loadOrders();
          }}
          onPrintInvoice={() => handlePrintInvoice(selectedOrder)}
          isUpdating={false}
          viewMode="modal"
        />
      )}

      {/* Invoice Printer */}
      {showInvoice && printingOrder && tenantSettings && (() => {
        const invoiceData = {
          orderCode: printingOrder.order_code,
          tableNumber: printingOrder.table?.number || "",
          tableDescription: printingOrder.table?.description || undefined,
          createdAt: printingOrder.created_at,
          paymentMethod: printingOrder.payment_method,
          paymentStatus: printingOrder.payment_status,
          items:
            printingOrder.items?.map((item) => {
              const options: string[] = [];
              item.options?.forEach((opt) => {
                const extraPrice = parseFloat(opt.extra_price_snapshot);
                if (extraPrice > 0) {
                  options.push(
                    `${opt.option_item_label_snapshot} (+${currencyFormatter.format(extraPrice)})`
                  );
                } else {
                  options.push(opt.option_item_label_snapshot);
                }
              });
              return {
                name: item.menu_name_snapshot,
                qty: item.qty,
                subtotal: parseFloat(item.subtotal),
                options: options.length > 0 ? options : undefined,
                note: item.item_note || undefined,
              };
            }) || [],
          totalAmount: parseFloat(printingOrder.total_amount),
          tenantName: tenantSettings.name,
          tenantLogoUrl: tenantSettings.logo_url || undefined,
          tenantAddress: tenantSettings.address || undefined,
          tenantPhone: tenantSettings.phone || undefined,
          cashierName: userData?.user.name || undefined,
          wifiName: wifiData.wifiName || undefined,
          wifiPassword: wifiData.wifiPassword || undefined,
        };

        return (
          <InvoicePrinter
            orderId={printingOrder.id}
            data={invoiceData}
            onPrintComplete={handleInvoicePrintComplete}
          />
        );
      })()}

      {/* WiFi Input Modal */}
      <WifiInputModal
        isOpen={showWifiModal}
        onClose={() => {
          setShowWifiModal(false);
          setIsWifiModalOpening(false);
          setIsPrinting(false);
          if (printingOrder && !showInvoice) {
            setPrintingOrder(null);
          }
        }}
        onConfirm={handleWifiConfirm}
      />

      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
        message={toast.message}
        variant={toast.variant}
        duration={3000}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </DashboardLayout>
  );
}
