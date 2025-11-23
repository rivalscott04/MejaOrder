"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { cn, currencyFormatter, formatTime, formatOrderCode } from "@/lib/utils";
import {
  fetchOrders,
  fetchOrderDetail,
  updateOrderStatus,
  updateOrderPaymentStatus,
  getCurrentUser,
  fetchTenantSettings,
  type Order,
  type LoginResponse,
  type TenantSettings,
} from "@/lib/api-client";
import {
  LayoutDashboard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Printer,
  Loader2,
} from "lucide-react";
import { OrderTableSkeleton } from "@/components/shared/menu-skeleton";
import { OrderDetailView } from "@/components/cashier/order-detail-view";
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge";
import { Monitor, LayoutGrid, Maximize2, Eye } from "lucide-react";
import { AlertModal } from "@/components/shared/alert-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { InvoicePrinter } from "@/components/tenant/invoice-printer";
import { WifiInputModal } from "@/components/tenant/wifi-input-modal";

type ViewMode = "modal" | "bottom-sheet" | "fullscreen";

export default function CashierDashboard() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "preparing" | "ready">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "unpaid" | "waiting_verification" | "paid">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("bottom-sheet");
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
  const [showInvoice, setShowInvoice] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [isWifiModalOpening, setIsWifiModalOpening] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [wifiData, setWifiData] = useState<{ wifiName: string; wifiPassword: string }>({
    wifiName: "",
    wifiPassword: "",
  });
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "danger" | "warning" | "info";
    extraButton?: {
      label: string;
      onClick: () => void;
      variant?: "primary" | "secondary";
    };
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "warning",
  });

  // Fetch orders
  const loadOrders = useCallback(async () => {
    try {
      const params: { order_status?: string; payment_status?: string; date?: string } = {};
      if (statusFilter !== "all") params.order_status = statusFilter;
      if (paymentFilter !== "all") params.payment_status = paymentFilter;
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
      params.date = today;

      const response = await fetchOrders(params);
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, paymentFilter]);

  // Fetch order detail
  const loadOrderDetail = useCallback(async (orderId: number) => {
    try {
      const order = await fetchOrderDetail(orderId);
      setSelectedOrder(order);
    } catch (error) {
      console.error("Failed to fetch order detail:", error);
    }
  }, []);

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

  // Handle invoice printing
  const handlePrintInvoice = () => {
    // Prevent double trigger
    if (showWifiModal || isWifiModalOpening || showInvoice) {
      return;
    }

    const orderToPrint = selectedOrder || printingOrder;
    if (orderToPrint && orderToPrint.payment_status === "paid") {
      // Ensure we have all required data before showing invoice
      if (!tenantSettings) {
        setAlertModal({
          isOpen: true,
          title: "Error",
          message: "Data tenant belum dimuat. Silakan refresh halaman.",
          variant: "error",
        });
        return;
      }
      if (!orderToPrint.items || orderToPrint.items.length === 0) {
        setAlertModal({
          isOpen: true,
          title: "Error",
          message: "Pesanan tidak memiliki item. Tidak dapat mencetak invoice.",
          variant: "error",
        });
        return;
      }
      // Set printing order if not already set
      if (!printingOrder) {
        setPrintingOrder(orderToPrint);
      }
      // Prevent double trigger
      setIsWifiModalOpening(true);
      // Open WiFi modal first
      setShowWifiModal(true);
    }
  };

  // Handle WiFi confirmation
  const handleWifiConfirm = (wifiName: string, wifiPassword: string) => {
    setWifiData({ wifiName, wifiPassword });
    setShowWifiModal(false);
    setIsWifiModalOpening(false);
    // Show invoice after WiFi data is confirmed
    setShowInvoice(true);
  };

  const handleInvoicePrintComplete = () => {
    setShowInvoice(false);
    // Reset WiFi data and printing order
    setWifiData({ wifiName: "", wifiPassword: "" });
    const printedOrderId = printingOrder?.id || selectedOrderId;
    setPrintingOrder(null);
    // Reload orders to update invoice_printed_at status
    loadOrders();
    if (selectedOrderId) {
      loadOrderDetail(selectedOrderId);
    } else if (printedOrderId) {
      // If we printed without opening detail, just reload orders
      // The order list will show updated status
    }
  };

  // Initial load
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
      if (selectedOrderId) {
        loadOrderDetail(selectedOrderId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadOrders, loadOrderDetail, selectedOrderId]);

  // Load order detail when selected
  useEffect(() => {
    if (selectedOrderId) {
      loadOrderDetail(selectedOrderId);
    } else {
      setSelectedOrder(null);
    }
  }, [selectedOrderId, loadOrderDetail]);

  const filtered = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
    const matchesSearch =
      order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table?.number?.includes(searchQuery) ||
      (order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesStatus && matchesPayment && matchesSearch;
  });

  // Calculate stats from today's orders
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((order) => order.created_at.startsWith(today));
  const todayStats = {
    totalOrders: todayOrders.length,
    revenue: todayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
    pendingVerifications: todayOrders.filter((o) => o.payment_status === "waiting_verification").length,
  };

  // Find orders that need invoice printing (ready or completed but invoice not printed)
  const ordersNeedingInvoice = orders.filter(
    (order) =>
      (order.order_status === "ready" || order.order_status === "completed") &&
      !order.invoice_printed_at &&
      order.payment_status === "paid"
  );

  // Handle order status update (with orderId parameter for quick actions)
  const handleStatusUpdate = async (
    newStatus: "accepted" | "preparing" | "ready" | "completed",
    orderId?: number
  ) => {
    const targetOrderId = orderId || selectedOrderId;
    if (!targetOrderId || isUpdating) return;

    const targetOrder = orderId 
      ? orders.find((o) => o.id === orderId) 
      : selectedOrder;
    
    // Check if trying to accept order but payment not verified
    if (newStatus === "accepted" && targetOrder) {
      if (targetOrder.payment_status !== "paid") {
        setAlertModal({
          isOpen: true,
          title: "Pembayaran Belum Diverifikasi",
          message: `Pesanan ${formatOrderCode(targetOrder.order_code)} belum memiliki pembayaran yang diverifikasi. Pastikan pembayaran sudah diverifikasi terlebih dahulu sebelum menerima pesanan.`,
          variant: "warning",
        });
        return;
      }
    }
    
    // Check if updating to "completed" and invoice not printed (show warning)
    // For "ready" status, we'll auto-print invoice in performStatusUpdate
    if (newStatus === "completed" && targetOrder) {
      if (targetOrder.payment_status === "paid" && !targetOrder.invoice_printed_at) {
        // Show confirmation modal for completed status with print invoice option
        const warningMessage = `Pesanan ${formatOrderCode(targetOrder.order_code)} akan ditandai sebagai "Selesai", tetapi invoice belum dicetak.\n\nPENTING: Invoice seharusnya sudah dicetak sebelum pesanan diantar. Segera cetak invoice untuk pelanggan.\n\nApakah Anda yakin ingin melanjutkan?`;
        
        // Function to handle print invoice from modal
        const handlePrintFromModal = async () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          // Prevent double trigger
          if (showWifiModal || isWifiModalOpening || showInvoice) {
            return;
          }
          // Load order detail first
          const orderDetail = await fetchOrderDetail(targetOrderId);
          setSelectedOrder(orderDetail);
          setSelectedOrderId(targetOrderId);
          // Trigger print invoice
          if (orderDetail.payment_status === "paid") {
            if (!tenantSettings) {
              const settings = await fetchTenantSettings();
              setTenantSettings(settings);
            }
            if (tenantSettings && orderDetail.items && orderDetail.items.length > 0) {
              setPrintingOrder(orderDetail);
              setIsWifiModalOpening(true);
              setShowWifiModal(true);
            }
          }
        };
        
        setConfirmModal({
          isOpen: true,
          title: "Invoice Belum Dicetak",
          message: warningMessage,
          variant: "warning",
          onConfirm: async () => {
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            await performStatusUpdate(newStatus, targetOrderId);
          },
          extraButton: {
            label: "Cetak Invoice",
            onClick: handlePrintFromModal,
            variant: "primary",
          },
        });
        return;
      }
    }

    await performStatusUpdate(newStatus, targetOrderId);
  };

  // Perform the actual status update
  const performStatusUpdate = async (
    newStatus: "accepted" | "preparing" | "ready" | "completed",
    targetOrderId: number
  ) => {
    try {
      setIsUpdating(true);
      setUpdatingOrderId(targetOrderId);
      await updateOrderStatus(targetOrderId, newStatus);
      // Reload data
      await loadOrders();
      
      // If updating to "ready" and payment is paid, auto-trigger invoice print
      if (newStatus === "ready") {
        // Get updated order data
        const updatedOrder = await fetchOrderDetail(targetOrderId);
        
        // Check if payment is paid and invoice not printed
        if (updatedOrder.payment_status === "paid" && !updatedOrder.invoice_printed_at) {
          // Prevent double trigger
          if (!showWifiModal && !isWifiModalOpening && !showInvoice) {
            // Set printing order (without opening detail view)
            setPrintingOrder(updatedOrder);
            
            // Check if we have all required data
            if (tenantSettings && updatedOrder.items && updatedOrder.items.length > 0) {
              // Prevent double trigger
              setIsWifiModalOpening(true);
              // Open WiFi modal first, then print invoice
              setShowWifiModal(true);
            } else {
              // If tenant settings not loaded yet, wait a bit and try again
              if (!tenantSettings) {
                const settings = await fetchTenantSettings();
                setTenantSettings(settings);
              }
              // If still missing data, show error
              if (!tenantSettings || !updatedOrder.items || updatedOrder.items.length === 0) {
                setAlertModal({
                  isOpen: true,
                  title: "Error",
                  message: "Data tidak lengkap untuk mencetak invoice. Silakan coba lagi.",
                  variant: "error",
                });
                setPrintingOrder(null);
              } else {
                setPrintingOrder(updatedOrder);
                setIsWifiModalOpening(true);
                setShowWifiModal(true);
              }
            }
          }
        } else {
          // If order detail was already selected, reload it
          if (selectedOrderId === targetOrderId) {
            await loadOrderDetail(selectedOrderId);
          }
        }
      } else {
        // For other status updates, just reload detail if selected
        if (selectedOrderId === targetOrderId) {
          await loadOrderDetail(selectedOrderId);
        }
      }
      
      // Show success feedback after a short delay to show loading state
      setTimeout(() => {
        setUpdatingOrderId(null);
        setAlertModal({
          isOpen: true,
          title: "Berhasil",
          message: "Status pesanan berhasil diupdate",
          variant: "success",
        });
        // Auto close after 2 seconds
        setTimeout(() => {
          setAlertModal((prev) => ({ ...prev, isOpen: false }));
        }, 2000);
      }, 300);
    } catch (error) {
      console.error("Failed to update order status:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal mengupdate status pesanan";
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: errorMessage,
        variant: "error",
      });
    } finally {
      setIsUpdating(false);
      setUpdatingOrderId(null);
    }
  };

  // Handle payment status update (with orderId parameter for quick actions)
  const handlePaymentUpdate = async (orderId?: number) => {
    const targetOrderId = orderId || selectedOrderId;
    if (!targetOrderId || isUpdating) return;

    try {
      setIsUpdating(true);
      setUpdatingOrderId(targetOrderId);
      await updateOrderPaymentStatus(targetOrderId, "paid");
      // Reload data
      await loadOrders();
      if (selectedOrderId === targetOrderId) {
        await loadOrderDetail(selectedOrderId);
      }
      // Show success feedback after a short delay to show loading state
      setTimeout(() => {
        setUpdatingOrderId(null);
        setAlertModal({
          isOpen: true,
          title: "Berhasil",
          message: "Status pembayaran berhasil diupdate",
          variant: "success",
        });
        // Auto close after 2 seconds
        setTimeout(() => {
          setAlertModal((prev) => ({ ...prev, isOpen: false }));
        }, 2000);
      }, 300);
    } catch (error) {
      console.error("Failed to update payment status:", error);
      setUpdatingOrderId(null);
      let errorMessage = "Gagal mengupdate status pembayaran";
      if (error instanceof Error) {
        if (error.message.includes("No query results") || error.message.includes("404")) {
          errorMessage = "Pesanan belum memiliki data pembayaran. Silakan pastikan pembayaran sudah dilakukan terlebih dahulu.";
        } else {
          errorMessage = error.message;
        }
      }
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: errorMessage,
        variant: "error",
      });
    } finally {
      setIsUpdating(false);
      setUpdatingOrderId(null);
    }
  };

  return (
    <DashboardLayout
      role="cashier"
      userEmail={userData?.user.email}
      userName={userData?.user.name}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Order Queue</h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
            Proses pesanan, verifikasi pembayaran, dan update status pesanan
          </p>
        </div>

        {/* Warning Banner for Orders Needing Invoice */}
        {ordersNeedingInvoice.length > 0 && (
          <div className="mb-4 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 p-4 shadow-lg animate-pulse">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-500 p-2 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                  ⚠️ PERINGATAN: Invoice Belum Dicetak
                </h3>
                <p className="mt-1.5 text-sm font-semibold text-amber-900">
                  Ada <span className="text-amber-700 font-bold text-base">{ordersNeedingInvoice.length}</span> pesanan yang sudah siap/selesai tetapi invoice belum dicetak!
                </p>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  PENTING: Invoice harus dicetak sebelum mengantar pesanan ke customer. Invoice dan makanan harus diberikan bersamaan.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ordersNeedingInvoice.slice(0, 5).map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="rounded-full bg-amber-200 border border-amber-400 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-300 transition shadow-sm"
                    >
                      {formatOrderCode(order.order_code)}
                    </button>
                  ))}
                  {ordersNeedingInvoice.length > 5 && (
                    <span className="rounded-full bg-amber-200 border border-amber-400 px-3 py-1.5 text-xs font-bold text-amber-900">
                      +{ordersNeedingInvoice.length - 5} lainnya
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-1">
        {/* Order Queue */}
        <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 lg:p-6 shadow-sm">
          <div className="mb-4 lg:mb-6 flex flex-col gap-3 lg:gap-4">
            <div className="flex items-center justify-between">
              <SectionTitle icon={<LayoutDashboard className="h-4 w-4" />} title="Antrian Pesanan" />
              {/* View Mode Toggle - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setViewMode("modal")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "modal"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                  title="Tampilan Modal"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("bottom-sheet")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "bottom-sheet"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                  title="Tampilan Bottom Sheet"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("fullscreen")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "fullscreen"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                  title="Tampilan Layar Penuh"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Search - Full width on mobile */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode/meja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filters - Buttons for mobile, Dropdowns for desktop */}
          <div className="mb-4 lg:mb-4 space-y-3">
            {/* Mobile: Buttons Layout */}
            <div className="lg:hidden space-y-3">
              {/* Status Filter */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "pending", "accepted", "preparing", "ready"] as const).map((status) => {
                    const statusLabels: Record<string, string> = {
                      all: "Semua",
                      pending: "Menunggu",
                      accepted: "Diterima",
                      preparing: "Sedang Disiapkan",
                      ready: "Siap",
                    };
                    return (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                          statusFilter === status
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
              {/* Payment Filter */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Bayar:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "unpaid", "waiting_verification", "paid"] as const).map((payment) => {
                    const paymentLabels: Record<string, string> = {
                      all: "Semua",
                      unpaid: "Belum Lunas",
                      waiting_verification: "Menunggu Verifikasi",
                      paid: "Lunas",
                    };
                    return (
                      <button
                        key={payment}
                        onClick={() => setPaymentFilter(payment)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                          paymentFilter === payment
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        {paymentLabels[payment] || payment.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Desktop: Dropdowns in one row */}
            <div className="hidden lg:flex lg:items-center lg:gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <label className="text-sm font-semibold text-slate-500 whitespace-nowrap">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-w-[180px]"
                >
                  <option value="all">Semua</option>
                  <option value="pending">Menunggu</option>
                  <option value="accepted">Diterima</option>
                  <option value="preparing">Sedang Disiapkan</option>
                  <option value="ready">Siap</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-500 whitespace-nowrap">Bayar:</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[180px]"
                >
                  <option value="all">Semua</option>
                  <option value="unpaid">Belum Lunas</option>
                  <option value="waiting_verification">Menunggu Verifikasi</option>
                  <option value="paid">Lunas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order List - Card layout for mobile, table for desktop */}
          {isLoading ? (
            <OrderTableSkeleton rows={5} />
            ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Tidak ada pesanan
            </div>
          ) : (
            <>
              {/* Mobile/Tablet Card View */}
              <div className="block lg:hidden space-y-3">
                {filtered.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isSelected={selectedOrderId === order.id}
                    onSelect={() => setSelectedOrderId(order.id)}
                    onQuickStatusUpdate={(status) => handleStatusUpdate(status, order.id)}
                    onQuickPaymentUpdate={() => handlePaymentUpdate(order.id)}
                    isUpdating={isUpdating}
                    updatingOrderId={updatingOrderId}
                  />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="pb-3">Waktu</th>
                      <th className="pb-3">Meja</th>
                      <th className="pb-3">Nama</th>
                      <th className="pb-3">Kode</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Bayar</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((order) => {
                      const needsInvoice = (order.order_status === "ready" || order.order_status === "completed") &&
                        !order.invoice_printed_at &&
                        order.payment_status === "paid";
                      return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={cn(
                          "cursor-pointer transition hover:bg-slate-50",
                          selectedOrderId === order.id && "bg-emerald-50",
                          needsInvoice && !(selectedOrderId === order.id) && "bg-amber-50/50 border-l-4 border-l-amber-500"
                        )}
                      >
                        <td className="py-3 text-slate-600">{formatTime(order.created_at)}</td>
                        <td className="py-3 font-semibold text-slate-900">Meja {order.table?.number || "-"}</td>
                        <td className="py-3 text-slate-600">{order.customer_name || "-"}</td>
                        <td className="py-3 text-slate-600">{formatOrderCode(order.order_code)}</td>
                        <td className="py-3 font-semibold text-slate-900">
                          {currencyFormatter.format(parseFloat(order.total_amount))}
                        </td>
                        <td className="py-3">
                          <PaymentMethodBadge method={order.payment_method} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={order.order_status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  if (newStatus !== order.order_status) {
                                    // Only call handleStatusUpdate for valid status transitions
                                    const validStatuses: ("accepted" | "preparing" | "ready" | "completed")[] = ["accepted", "preparing", "ready", "completed"];
                                    if (validStatuses.includes(newStatus as any)) {
                                      handleStatusUpdate(newStatus as "accepted" | "preparing" | "ready" | "completed", order.id);
                                    }
                                    // For "pending" and "canceled", we might need a different handler
                                    // For now, just allow the selection but don't update if it's not a valid transition
                                  }
                                }}
                                disabled={isUpdating && updatingOrderId === order.id}
                                className={cn(
                                  "appearance-none rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 min-w-[140px] cursor-pointer",
                                  order.order_status === "pending" && "border-slate-300 bg-slate-100 text-slate-700",
                                  order.order_status === "accepted" && "border-amber-300 bg-amber-100 text-amber-700",
                                  order.order_status === "preparing" && "border-amber-300 bg-amber-100 text-amber-700",
                                  order.order_status === "ready" && "border-emerald-300 bg-emerald-100 text-emerald-700",
                                  order.order_status === "completed" && "border-emerald-400 bg-emerald-200 text-emerald-800",
                                  order.order_status === "canceled" && "border-rose-300 bg-rose-100 text-rose-700",
                                  (isUpdating && updatingOrderId === order.id) && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <option value="pending">Menunggu</option>
                                <option value="accepted">Diterima</option>
                                <option value="preparing">Sedang Disiapkan</option>
                                <option value="ready">Siap</option>
                                <option value="completed">Selesai</option>
                                <option value="canceled">Dibatalkan</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                            </div>
                            {(order.order_status === "ready" || order.order_status === "completed") &&
                              !order.invoice_printed_at &&
                              order.payment_status === "paid" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 border border-amber-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                                  <AlertTriangle className="h-3 w-3" />
                                  Belum Cetak
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            {order.payment_status === "paid" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Prevent double trigger
                                  if (showWifiModal || isWifiModalOpening || showInvoice) {
                                    return;
                                  }
                                  const handlePrint = async () => {
                                    // Don't set selectedOrder/selectedOrderId to avoid opening detail modal
                                    const orderDetail = await fetchOrderDetail(order.id);
                                    if (orderDetail.payment_status === "paid") {
                                      if (!tenantSettings) {
                                        const settings = await fetchTenantSettings();
                                        setTenantSettings(settings);
                                      }
                                      if (tenantSettings && orderDetail.items && orderDetail.items.length > 0) {
                                        setPrintingOrder(orderDetail);
                                        setIsWifiModalOpening(true);
                                        setShowWifiModal(true);
                                      }
                                    }
                                  };
                                  handlePrint();
                                }}
                                className="group relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                                title="Cetak Invoice"
                              >
                                <Printer className="h-4 w-4" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  Cetak Invoice
                                </span>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderId(order.id);
                              }}
                              className="group relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                Lihat Detail
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) for Quick Status Update */}
      {selectedOrder && selectedOrderId && (
        <QuickActionFAB
          order={selectedOrder}
          onStatusUpdate={(status) => handleStatusUpdate(status, selectedOrderId)}
          isUpdating={isUpdating}
          updatingOrderId={updatingOrderId}
        />
      )}

      {/* Modal, Bottom Sheet, or Fullscreen views */}
        {selectedOrder && (
          <OrderDetailView
            order={selectedOrder}
            onClose={() => {
              setSelectedOrderId(null);
              setSelectedOrder(null);
              setShowInvoice(false);
            }}
            onStatusUpdate={(status) => handleStatusUpdate(status, selectedOrderId || undefined)}
            onPaymentUpdate={() => handlePaymentUpdate(selectedOrderId || undefined)}
            onPrintInvoice={handlePrintInvoice}
            isUpdating={isUpdating}
            viewMode={viewMode}
          />
        )}

        {/* Invoice Printer */}
        {showInvoice && (selectedOrder || printingOrder) && tenantSettings && (() => {
          const orderForInvoice = selectedOrder || printingOrder!;
          const invoiceData = {
            orderCode: orderForInvoice.order_code,
            tableNumber: orderForInvoice.table?.number || "",
            tableDescription: orderForInvoice.table?.description || undefined,
            createdAt: orderForInvoice.created_at,
            paymentMethod: orderForInvoice.payment_method,
            paymentStatus: orderForInvoice.payment_status,
            items:
              orderForInvoice.items?.map((item) => {
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
            totalAmount: parseFloat(orderForInvoice.total_amount),
            tenantName: tenantSettings.name,
            tenantLogoUrl: tenantSettings.logo_url || undefined,
            tenantAddress: tenantSettings.address || undefined,
            tenantPhone: tenantSettings.phone || undefined,
            cashierName: userData?.user.name || undefined,
            wifiName: wifiData.wifiName || undefined,
            wifiPassword: wifiData.wifiPassword || undefined,
          };
          
          // Debug log
          console.log("Preparing to print invoice:", {
            hasItems: invoiceData.items.length > 0,
            itemsCount: invoiceData.items.length,
            tenantName: invoiceData.tenantName,
            orderCode: invoiceData.orderCode,
          });
          
          return (
            <InvoicePrinter
              orderId={orderForInvoice.id}
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
            // Reset printing order if modal is closed without confirming
            if (printingOrder && !showInvoice) {
              setPrintingOrder(null);
            }
          }}
          onConfirm={handleWifiConfirm}
        />
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel="Ya, Lanjutkan"
        cancelLabel="Batal"
        isLoading={isUpdating}
      />
    </DashboardLayout>
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
    <span className={cn("mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold", variants[status] ?? "bg-slate-100 text-slate-700")}>
      {statusLabels[status] || status.replace("_", " ")}
    </span>
  );
}

// Order Card with Quick Actions and Status Stepper
function OrderCard({
  order,
  isSelected,
  onSelect,
  onQuickStatusUpdate,
  onQuickPaymentUpdate,
  isUpdating,
  updatingOrderId,
}: {
  order: Order;
  isSelected: boolean;
  onSelect: () => void;
  onQuickStatusUpdate: (status: "accepted" | "preparing" | "ready" | "completed") => void;
  onQuickPaymentUpdate: () => void;
  isUpdating: boolean;
  updatingOrderId: number | null;
}) {
  const statusSteps = [
    { key: "pending", label: "Menunggu", next: "accepted" },
    { key: "accepted", label: "Diterima", next: "preparing" },
    { key: "preparing", label: "Disiapkan", next: "ready" },
    { key: "ready", label: "Siap", next: "completed" },
    { key: "completed", label: "Selesai", next: null },
  ];

  const currentIndex = statusSteps.findIndex((step) => step.key === order.order_status);
  const nextStatus = statusSteps[currentIndex]?.next as "accepted" | "preparing" | "ready" | "completed" | null;
  const nextStatusLabel = nextStatus
    ? statusSteps.find((s) => s.key === nextStatus)?.label || ""
    : null;

  const isThisOrderUpdating = isUpdating && updatingOrderId === order.id;

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't allow status update if payment not verified (except for pending status)
    if (order.order_status === "pending" && order.payment_status !== "paid") {
      return;
    }
    if (nextStatus && !isThisOrderUpdating) {
      onQuickStatusUpdate(nextStatus);
    }
  };

  const handleStepClick = (e: React.MouseEvent, stepIndex: number) => {
    e.stopPropagation();
    // Don't allow status update if payment not verified (except for pending status)
    if (order.order_status === "pending" && order.payment_status !== "paid") {
      return;
    }
    if (stepIndex > currentIndex && stepIndex <= currentIndex + 1) {
      const targetStep = statusSteps[stepIndex];
      if (targetStep.next) {
        const targetStatus = statusSteps.find((s) => s.key === targetStep.next)?.key;
        if (targetStatus && !isUpdating) {
          onQuickStatusUpdate(targetStatus as "accepted" | "preparing" | "ready" | "completed");
        }
      }
    }
  };

  const needsInvoice = (order.order_status === "ready" || order.order_status === "completed") &&
    !order.invoice_printed_at &&
    order.payment_status === "paid";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 p-4 transition",
        isSelected
          ? "border-emerald-500 bg-emerald-50"
          : needsInvoice
            ? "border-amber-400 bg-amber-50/70 hover:border-amber-500 shadow-md"
            : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500">{formatTime(order.created_at)}</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="font-semibold text-slate-900">Meja {order.table?.number || "-"}</span>
          </div>
          {order.customer_name && (
            <p className="text-xs text-slate-700 font-semibold mb-1">{order.customer_name}</p>
          )}
          <p className="text-xs text-slate-600 font-mono">{formatOrderCode(order.order_code)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.order_status} />
          {(order.order_status === "ready" || order.order_status === "completed") &&
            !order.invoice_printed_at &&
            order.payment_status === "paid" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 border border-amber-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                Belum Cetak
              </span>
            )}
        </div>
      </div>

      {/* Interactive Status Stepper */}
      <div className="mb-3 py-2">
        <div className="flex items-center justify-between gap-1">
          {statusSteps.slice(0, 4).map((step, index) => {
            const isActive = step.key === order.order_status;
            const isPast = currentIndex > index;
            const isNext = index === currentIndex + 1;
            // Disable if payment not verified and trying to move from pending
            const paymentBlocked = order.order_status === "pending" && order.payment_status !== "paid" && step.key === "accepted";
            const isClickable = isNext && !isThisOrderUpdating && !paymentBlocked;
            const isUpdatingToThisStep = isThisOrderUpdating && isNext;

            return (
              <div key={step.key} className="flex flex-1 flex-col items-center">
                <button
                  onClick={(e) => handleStepClick(e, index)}
                  disabled={!isClickable || isThisOrderUpdating}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all touch-manipulation",
                    isActive
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                      : isPast
                        ? "border-slate-300 bg-slate-100 text-slate-500"
                        : isUpdatingToThisStep
                          ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                          : isClickable
                            ? "border-emerald-300 bg-white text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 active:scale-95"
                            : "border-slate-200 bg-white text-slate-300",
                    isClickable && "cursor-pointer"
                  )}
                >
                  {isUpdatingToThisStep ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPast ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </button>
                <p
                  className={cn(
                    "mt-1 text-[9px] font-semibold text-center leading-tight",
                    isActive
                      ? "text-emerald-700"
                      : isPast
                        ? "text-slate-500"
                        : isClickable
                          ? "text-emerald-600"
                          : "text-slate-300"
                  )}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Status Section */}
      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Status Pembayaran</p>
            <PaymentStatusBadge status={order.payment_status} />
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Total</p>
            <p className="text-sm font-bold text-slate-900">
              {currencyFormatter.format(parseFloat(order.total_amount))}
            </p>
          </div>
        </div>
        {order.payment_status !== "paid" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickPaymentUpdate();
            }}
            disabled={isThisOrderUpdating}
            className={cn(
              "mt-2 w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center gap-2",
              isThisOrderUpdating && "opacity-50"
            )}
          >
            {isThisOrderUpdating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              "✓ Tandai Sudah Bayar"
            )}
          </button>
        )}
      </div>

      {/* Quick Action Button */}
      {nextStatus && (
        <button
          onClick={handleQuickAction}
          disabled={isThisOrderUpdating || order.payment_status !== "paid"}
          className={cn(
            "w-full rounded-xl border-2 border-emerald-500 bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center gap-2",
            (isThisOrderUpdating || order.payment_status !== "paid") && "opacity-50"
          )}
          title={order.payment_status !== "paid" ? "Pembayaran harus diverifikasi terlebih dahulu" : ""}
        >
          {isThisOrderUpdating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : order.payment_status !== "paid" ? (
            "Verifikasi Pembayaran Dulu"
          ) : (
            `→ ${nextStatusLabel}`
          )}
        </button>
      )}
    </div>
  );
}

// Floating Action Button for Quick Status Update
function QuickActionFAB({
  order,
  onStatusUpdate,
  isUpdating,
  updatingOrderId,
}: {
  order: Order;
  onStatusUpdate: (status: "accepted" | "preparing" | "ready" | "completed") => void;
  isUpdating: boolean;
  updatingOrderId: number | null;
}) {
  const statusSteps = [
    { key: "pending", label: "Terima Pesanan", next: "accepted" },
    { key: "accepted", label: "Sedang Disiapkan", next: "preparing" },
    { key: "preparing", label: "Siap Diantar", next: "ready" },
    { key: "ready", label: "Tandai Selesai", next: "completed" },
  ];

  const currentStep = statusSteps.find((step) => step.key === order.order_status);
  const nextStatus = currentStep?.next as "accepted" | "preparing" | "ready" | "completed" | null;
  const isThisOrderUpdating = updatingOrderId === order.id;

  if (!nextStatus || order.order_status === "completed" || order.order_status === "canceled") {
    return null;
  }

  return (
    <button
      onClick={() => onStatusUpdate(nextStatus)}
      disabled={isThisOrderUpdating}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation lg:hidden"
    >
      {isThisOrderUpdating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          <ChevronRight className="h-5 w-5" />
          <span>{currentStep?.label}</span>
        </>
      )}
    </button>
  );
}

