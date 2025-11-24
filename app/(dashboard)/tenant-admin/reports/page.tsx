"use client";

import { useState, useEffect, type ReactNode } from "react";
import { SectionTitle } from "@/components/shared/section-title";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { cn, currencyFormatter, formatTime, formatOrderCode } from "@/lib/utils";
import {
  BarChart3,
  Printer,
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  FileText,
  Receipt,
  Calendar,
  PieChart,
  Activity,
  AlertCircle,
  Download,
} from "lucide-react";
import { WifiInputModal } from "@/components/tenant/wifi-input-modal";
import { InvoicePrinter } from "@/components/tenant/invoice-printer";
import { ReportFilters, type ReportFiltersState } from "@/components/reports/report-filters";
import {
  fetchOrders,
  fetchCompletedOrders,
  fetchOrderDetail,
  fetchTenantSettings,
  fetchUsageStats,
  getCurrentUser,
  type Order,
  type TenantSettings,
  type LoginResponse,
  type UsageStats,
} from "@/lib/api-client";
import {
  exportToExcel,
  exportSingleSheetExcel,
  formatDateForFilename,
  formatCurrencyForExcel,
} from "@/lib/excel-export";
import { TableSkeleton, StatsGridSkeleton } from "@/components/shared/menu-skeleton";

type ReportTab = "financial" | "sales" | "operational" | "analytics" | "accounting";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("financial");
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [userData, setUserData] = useState<LoginResponse | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [salesFilters, setSalesFilters] = useState<ReportFiltersState>({});

  // Fetch orders and tenant settings from API
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch user data, orders, settings, and usage stats in parallel
      const [userResponse, incompleteOrdersResponse, completedOrdersResponse, settingsData, statsData] = await Promise.all([
        getCurrentUser().catch(() => null),
        fetchOrders({ 
          all: true,
          date_from: dateRange.start,
          date_to: dateRange.end,
        }).catch(() => ({ data: [] })),
        fetchCompletedOrders({ 
          all: true,
          date_from: dateRange.start,
          date_to: dateRange.end,
        }).catch(() => ({ data: [] })),
        fetchTenantSettings().catch(() => null), // Don't fail if settings fetch fails
        fetchUsageStats().catch(() => null), // Don't fail if stats fetch fails
      ]);

      if (userResponse) {
        setUserData(userResponse);
      }

      // Combine incomplete and completed orders, remove duplicates
      const allOrders = [...(incompleteOrdersResponse.data || []), ...(completedOrdersResponse.data || [])];
      const uniqueOrders = allOrders.filter(
        (order, index, self) => index === self.findIndex((o) => o.id === order.id)
      );
      setOrders(uniqueOrders);
      
      if (settingsData) {
        setTenantSettings(settingsData);
      }
      if (statsData) {
        setUsageStats(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat data");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange.start, dateRange.end]);

  const handlePrintInvoice = async (order: Order) => {
    setIsLoadingDetail(true);
    try {
      // Fetch full order detail with items
      const orderDetail = await fetchOrderDetail(order.id);
      setSelectedOrder(orderDetail);
      setShowWifiModal(true);
    } catch (err) {
      console.error("Failed to fetch order detail:", err);
      // Use basic order data if detail fetch fails
      setSelectedOrder(order);
      setShowWifiModal(true);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleWifiConfirm = (name: string, password: string) => {
    setWifiName(name);
    setWifiPassword(password);
    setShowWifiModal(false);
    setShowInvoice(true);
  };

  const handlePrintComplete = () => {
    setShowInvoice(false);
    setSelectedOrder(null);
    setWifiName("");
    setWifiPassword("");
  };

  const allReportTabs: Array<{ id: ReportTab; label: string; icon: ReactNode }> = [
    { id: "financial", label: "Keuangan", icon: <DollarSign className="h-4 w-4" /> },
    { id: "sales", label: "Penjualan", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "operational", label: "Operasional", icon: <Activity className="h-4 w-4" /> },
    { id: "analytics", label: "Analitik", icon: <PieChart className="h-4 w-4" /> },
    { id: "accounting", label: "Akuntansi", icon: <FileText className="h-4 w-4" /> },
  ];

  // Filter tabs berdasarkan plan
  const allowedTabs = usageStats?.allowed_report_tabs;
  const reportTabs = allowedTabs && allowedTabs.length > 0
    ? allReportTabs.filter((tab) => allowedTabs.includes(tab.id))
    : allReportTabs; // Jika null atau empty, tampilkan semua (backward compatibility)

  // Jika activeTab tidak ada di allowed tabs, set ke tab pertama yang diizinkan
  useEffect(() => {
    if (reportTabs.length > 0 && !reportTabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(reportTabs[0].id);
    }
  }, [reportTabs, activeTab]);

  // Export functions

  // Export functions
  const handleExportFinancial = () => {
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    const totalTransactions = orders.length;
    const avgTransaction = totalRevenue / Math.max(totalTransactions, 1);

    const headers = ["Metode Pembayaran", "Jumlah Transaksi", "Total Pendapatan", "Persentase"];
    const rows = ["cash", "transfer", "qris"].map((method) => {
      const methodOrders = orders.filter((o) => o.payment_method === method);
      const methodTotal = methodOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
      const percentage = totalRevenue > 0 ? (methodTotal / totalRevenue) * 100 : 0;
      return [
        method.toUpperCase(),
        methodOrders.length,
        formatCurrencyForExcel(methodTotal),
        `${percentage.toFixed(2)}%`,
      ];
    });

    exportSingleSheetExcel(
      headers,
      rows,
      `laporan-keuangan-${formatDateForFilename()}.xlsx`,
      "Laporan Keuangan"
    );
  };

  const handleExportSales = () => {
    // Export penjualan per menu
    const menuSales = new Map<string, { qty: number; revenue: number }>();
    
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const menuName = item.menu_name_snapshot;
        const current = menuSales.get(menuName) || { qty: 0, revenue: 0 };
        menuSales.set(menuName, {
          qty: current.qty + item.qty,
          revenue: current.revenue + parseFloat(item.subtotal),
        });
      });
    });

    const menuHeaders = ["Nama Menu", "Jumlah Terjual", "Total Revenue"];
    const menuRows = Array.from(menuSales.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, data]) => [name, data.qty, formatCurrencyForExcel(data.revenue)]);

    exportSingleSheetExcel(
      menuHeaders,
      menuRows,
      `laporan-penjualan-${formatDateForFilename()}.xlsx`,
      "Penjualan per Menu"
    );
  };

  const handleExportOperational = () => {
    const headers = [
      "Waktu",
      "Kode Pesanan",
      "Meja",
      "Total",
      "Metode Pembayaran",
      "Status Pembayaran",
      "Status Pesanan",
    ];
    const rows = orders.map((order) => [
      new Date(order.created_at).toLocaleString("id-ID"),
      order.order_code,
      order.table?.number || "N/A",
      formatCurrencyForExcel(parseFloat(order.total_amount)),
      order.payment_method.toUpperCase(),
      order.payment_status.replace("_", " "),
      order.order_status,
    ]);

    exportSingleSheetExcel(
      headers,
      rows,
      `laporan-operasional-${formatDateForFilename()}.xlsx`,
      "Laporan Operasional"
    );
  };

  const handleExportAll = () => {
    // Export semua laporan dalam satu file dengan multiple sheets
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

    // Sheet 1: Summary
    const summaryHeaders = ["Item", "Nilai"];
    const summaryRows = [
      ["Total Pendapatan", formatCurrencyForExcel(totalRevenue)],
      ["Total Transaksi", orders.length],
      ["Rata-rata Transaksi", formatCurrencyForExcel(totalRevenue / Math.max(orders.length, 1))],
      ["Pesanan Lunas", orders.filter((o) => o.payment_status === "paid").length],
    ];

    // Sheet 2: Pembayaran per Metode
    const paymentHeaders = ["Metode Pembayaran", "Jumlah Transaksi", "Total Pendapatan"];
    const paymentRows = ["cash", "transfer", "qris"].map((method) => {
      const methodOrders = orders.filter((o) => o.payment_method === method);
      const methodTotal = methodOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
      return [method.toUpperCase(), methodOrders.length, formatCurrencyForExcel(methodTotal)];
    });

    // Sheet 3: Detail Pesanan
    const orderHeaders = [
      "Waktu",
      "Kode Pesanan",
      "Meja",
      "Total",
      "Metode Pembayaran",
      "Status Pembayaran",
      "Status Pesanan",
    ];
    const orderRows = orders.map((order) => [
      new Date(order.created_at).toLocaleString("id-ID"),
      order.order_code,
      order.table?.number || "N/A",
      formatCurrencyForExcel(parseFloat(order.total_amount)),
      order.payment_method.toUpperCase(),
      order.payment_status.replace("_", " "),
      order.order_status,
    ]);

    exportToExcel(
      [
        { sheetName: "Summary", headers: summaryHeaders, rows: summaryRows },
        { sheetName: "Pembayaran", headers: paymentHeaders, rows: paymentRows },
        { sheetName: "Detail Pesanan", headers: orderHeaders, rows: orderRows },
      ],
      `laporan-lengkap-${formatDateForFilename()}.xlsx`
    );
  };

  const handleExportTax = () => {
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const taxPercentage = tenantSettings?.tax_percentage || 0;

    // Summary sheet
    const summaryHeaders = ["Item", "Nilai"];
    const totalGross = paidOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    const totalTax = totalGross * (taxPercentage / 100);
    const totalNet = totalGross - totalTax;
    const summaryRows = [
      ["Total Transaksi", paidOrders.length],
      ["Penjualan Kotor", formatCurrencyForExcel(totalGross)],
      [`Pajak ${taxPercentage}%`, formatCurrencyForExcel(totalTax)],
      ["Penjualan Bersih", formatCurrencyForExcel(totalNet)],
    ];

    // Daily breakdown sheet
    const dailyHeaders = ["Tanggal", "Jumlah Transaksi", "Penjualan Kotor", "Pajak", "Penjualan Bersih"];
    const dailyBreakdown = new Map<string, { gross: number; tax: number; net: number; count: number }>();
    paidOrders.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split("T")[0];
      const current = dailyBreakdown.get(date) || { gross: 0, tax: 0, net: 0, count: 0 };
      const orderAmount = parseFloat(order.total_amount);
      const orderTax = orderAmount * (taxPercentage / 100);
      const orderNet = orderAmount - orderTax;
      dailyBreakdown.set(date, {
        gross: current.gross + orderAmount,
        tax: current.tax + orderTax,
        net: current.net + orderNet,
        count: current.count + 1,
      });
    });

    const dailyRows = Array.from(dailyBreakdown.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, data]) => [
        new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }),
        data.count,
        formatCurrencyForExcel(data.gross),
        formatCurrencyForExcel(data.tax),
        formatCurrencyForExcel(data.net),
      ]);

    // Add total row
    dailyRows.push([
      "TOTAL",
      paidOrders.length,
      formatCurrencyForExcel(totalGross),
      formatCurrencyForExcel(totalTax),
      formatCurrencyForExcel(totalNet),
    ]);

    exportToExcel(
      [
        { sheetName: "Ringkasan", headers: summaryHeaders, rows: summaryRows },
        { sheetName: "Breakdown Harian", headers: dailyHeaders, rows: dailyRows },
      ],
      `laporan-pajak-${formatDateForFilename()}.xlsx`
    );
  };

  const renderFinancialReports = () => {
    // Calculate financial metrics from filtered orders
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    const totalTransactions = orders.length;
    const avgTransaction = totalRevenue / Math.max(totalTransactions, 1);
    const paidOrdersCount = paidOrders.length;
    const paidPercentage = (paidOrdersCount / Math.max(totalTransactions, 1)) * 100;

    return (
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <Calendar className="h-5 w-5 text-slate-500" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <span className="text-slate-500">s/d</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Total Pendapatan</p>
                <p className="mt-2 text-2xl font-bold text-emerald-900">
                  {currencyFormatter.format(totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-emerald-600">Periode terpilih</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Transaksi</p>
                <p className="mt-2 text-2xl font-bold text-blue-900">{totalTransactions}</p>
                <p className="mt-1 text-xs text-blue-600">Pesanan</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Rata-rata Transaksi</p>
                <p className="mt-2 text-2xl font-bold text-amber-900">
                  {currencyFormatter.format(avgTransaction)}
                </p>
                <p className="mt-1 text-xs text-amber-600">Per pesanan</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Pesanan Lunas</p>
                <p className="mt-2 text-2xl font-bold text-purple-900">
                  {paidOrdersCount}
                </p>
                <p className="mt-1 text-xs text-purple-600">
                  {paidPercentage.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={<Receipt className="h-4 w-4" />} title="Pembayaran per Metode" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["cash", "transfer", "qris"].map((method) => {
              const methodOrders = orders.filter((o) => o.payment_method === method);
              const total = methodOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
              const allOrdersTotal = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
              return (
                <div key={method} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold capitalize text-slate-700">{method}</span>
                    <span className="text-xs text-slate-500">
                      {methodOrders.length} transaksi
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {currencyFormatter.format(total)}
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${(total / Math.max(allOrdersTotal, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Grafik Pendapatan" />
          <div className="mt-6 flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
            <p className="text-sm text-slate-500">Grafik pendapatan akan ditampilkan di sini</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSalesReports = () => {
    // Filter orders berdasarkan sales filters
    let filteredOrders = orders;
    if (salesFilters.paymentMethod) {
      filteredOrders = filteredOrders.filter((o) => o.payment_method === salesFilters.paymentMethod);
    }
    if (salesFilters.orderStatus) {
      filteredOrders = filteredOrders.filter((o) => o.order_status === salesFilters.orderStatus);
    }
    if (salesFilters.paymentStatus) {
      filteredOrders = filteredOrders.filter((o) => o.payment_status === salesFilters.paymentStatus);
    }
    if (salesFilters.search) {
      const searchLower = salesFilters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(
        (o) =>
          o.order_code.toLowerCase().includes(searchLower) ||
          o.table?.number?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate sales data from filtered orders
    const menuSales = new Map<string, { qty: number; revenue: number; orders: number }>();
    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const menuName = item.menu_name_snapshot;
        const current = menuSales.get(menuName) || { qty: 0, revenue: 0, orders: 0 };
        menuSales.set(menuName, {
          qty: current.qty + item.qty,
          revenue: current.revenue + parseFloat(item.subtotal),
          orders: current.orders + 1,
        });
      });
    });

    const topMenus = Array.from(menuSales.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10);

    // Calculate sales by time period
    const timePeriods = [
      { start: 8, end: 12, period: "08:00 - 12:00", label: "Pagi" },
      { start: 12, end: 17, period: "12:00 - 17:00", label: "Siang" },
      { start: 17, end: 21, period: "17:00 - 21:00", label: "Malam" },
    ];

    const salesByTimePeriod = timePeriods.map(({ start, end, period, label }) => {
      const periodOrders = filteredOrders.filter((order) => {
        const orderHour = new Date(order.created_at).getHours();
        return orderHour >= start && orderHour < end;
      });
      const revenue = periodOrders
        .filter((o) => o.payment_status === "paid")
        .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
      return { period, label, revenue, orders: periodOrders.length };
    });

    return (
      <div className="space-y-6">
        {/* Filters */}
        <ReportFilters
          paymentMethods={[
            { value: "cash", label: "Cash" },
            { value: "transfer", label: "Transfer" },
            { value: "qris", label: "QRIS" },
          ]}
          orderStatuses={[
            { value: "pending", label: "Menunggu" },
            { value: "accepted", label: "Diterima" },
            { value: "preparing", label: "Sedang Disiapkan" },
            { value: "ready", label: "Siap" },
            { value: "completed", label: "Selesai" },
            { value: "canceled", label: "Dibatalkan" },
          ]}
          paymentStatuses={[
            { value: "unpaid", label: "Belum Bayar" },
            { value: "waiting_verification", label: "Menunggu Verifikasi" },
            { value: "paid", label: "Lunas" },
            { value: "failed", label: "Gagal" },
            { value: "refunded", label: "Refund" },
          ]}
          onFilterChange={setSalesFilters}
        />

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6">
            <p className="text-sm font-medium text-emerald-700">Total Penjualan</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">
              {currencyFormatter.format(
                filteredOrders
                  .filter((o) => o.payment_status === "paid")
                  .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
              )}
            </p>
            <p className="mt-1 text-xs text-emerald-600">{filteredOrders.length} pesanan</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
            <p className="text-sm font-medium text-blue-700">Menu Terjual</p>
            <p className="mt-2 text-2xl font-bold text-blue-900">{menuSales.size}</p>
            <p className="mt-1 text-xs text-blue-600">Jenis menu berbeda</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100 p-6">
            <p className="text-sm font-medium text-amber-700">Rata-rata per Pesanan</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">
              {currencyFormatter.format(
                filteredOrders.length > 0
                  ? filteredOrders
                      .filter((o) => o.payment_status === "paid")
                      .reduce((sum, o) => sum + parseFloat(o.total_amount), 0) / filteredOrders.length
                  : 0
              )}
            </p>
            <p className="mt-1 text-xs text-amber-600">Per transaksi</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Package className="h-4 w-4" />} title="Penjualan per Menu" />
            <button
              onClick={handleExportSales}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
          <div className="mt-6">
            {topMenus.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Tidak ada data penjualan</div>
            ) : (
              <div className="space-y-3">
                {topMenus.map(([name, data], idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {data.qty} item terjual • {data.orders} pesanan
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{currencyFormatter.format(data.revenue)}</p>
                      <p className="text-xs text-slate-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Penjualan per Kategori" />
          <div className="mt-6">
            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Tidak ada data penjualan</div>
            ) : (
              <div className="py-8 text-center text-slate-500">
                Data kategori akan tersedia setelah integrasi dengan data menu
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={<Clock className="h-4 w-4" />} title="Penjualan per Periode Waktu" />
          <div className="mt-6">
            <div className="space-y-3">
              {salesByTimePeriod.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.period}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.label} • {item.orders} pesanan</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{currencyFormatter.format(item.revenue)}</p>
                    <p className="text-xs text-slate-500">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOperationalReports = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={<Activity className="h-4 w-4" />} title="Status Pesanan" />
          <div className="mt-6 space-y-3">
            {[
              { status: "completed", label: "Selesai", count: orders.filter((o) => o.order_status === "completed").length, color: "emerald" },
              { status: "preparing", label: "Sedang Disiapkan", count: orders.filter((o) => o.order_status === "preparing").length, color: "amber" },
              { status: "pending", label: "Menunggu", count: orders.filter((o) => o.order_status === "pending").length, color: "slate" },
              { status: "canceled", label: "Dibatalkan", count: orders.filter((o) => o.order_status === "canceled").length, color: "red" },
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className={`font-bold text-${item.color}-600`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={<AlertCircle className="h-4 w-4" />} title="Status Pembayaran" />
          <div className="mt-6 space-y-3">
            {[
              { status: "paid", label: "Lunas", count: orders.filter((o) => o.payment_status === "paid").length, color: "emerald" },
              { status: "waiting_verification", label: "Menunggu Verifikasi", count: orders.filter((o) => o.payment_status === "waiting_verification").length, color: "amber" },
              { status: "unpaid", label: "Belum Bayar", count: orders.filter((o) => o.payment_status === "unpaid").length, color: "slate" },
              { status: "refunded", label: "Refund", count: orders.filter((o) => o.payment_status === "refunded").length, color: "red" },
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className={`font-bold text-${item.color}-600`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Daftar Pesanan" />
        {error && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        )}
        <div className="mt-6 overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Tidak ada pesanan</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3">Waktu</th>
                  <th className="pb-3">Meja</th>
                  <th className="pb-3">Kode</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Pembayaran</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="py-4 text-slate-600">{formatTime(order.created_at)}</td>
                    <td className="py-4 font-semibold text-slate-900">
                      Meja {order.table?.number || "N/A"}
                    </td>
                    <td className="py-4 text-slate-600">{formatOrderCode(order.order_code)}</td>
                    <td className="py-4 font-semibold text-slate-900">
                      {currencyFormatter.format(parseFloat(order.total_amount))}
                    </td>
                    <td className="py-4">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                          order.payment_status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.payment_status === "waiting_verification"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {order.payment_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handlePrintInvoice(order)}
                        disabled={isLoadingDetail}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        {isLoadingDetail ? "Loading..." : "Cetak"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsReports = () => {
    // Calculate best selling menus from orders
    const menuSales = new Map<string, { qty: number; revenue: number }>();
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const menuName = item.menu_name_snapshot;
        const current = menuSales.get(menuName) || { qty: 0, revenue: 0 };
        menuSales.set(menuName, {
          qty: current.qty + item.qty,
          revenue: current.revenue + parseFloat(item.subtotal),
        });
      });
    });

    const bestSellingMenus = Array.from(menuSales.entries())
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 10)
      .map(([name, data], idx) => ({
        name,
        sales: data.qty,
        revenue: data.revenue,
        rank: idx + 1,
      }));

    // Calculate busy hours analysis
    const hourlyOrders = new Map<number, number>();
    orders.forEach((order) => {
      const hour = new Date(order.created_at).getHours();
      hourlyOrders.set(hour, (hourlyOrders.get(hour) || 0) + 1);
    });

    // Get top 3 busiest hours
    const busiestHours = Array.from(hourlyOrders.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => {
        const nextHour = hour + 1;
        const hourStr = `${hour.toString().padStart(2, "0")}:00 - ${nextHour.toString().padStart(2, "0")}:00`;
        let label = "Normal";
        if (hour >= 12 && hour < 14) label = "Puncak Siang";
        else if (hour >= 18 && hour < 20) label = "Puncak Malam";
        else if (hour >= 8 && hour < 12) label = "Pagi";
        else if (hour >= 14 && hour < 17) label = "Siang";
        else if (hour >= 17 && hour < 21) label = "Malam";
        return { hour: hourStr, orders: count, label };
      });

    const maxOrders = busiestHours.length > 0 ? Math.max(...busiestHours.map((h) => h.orders)) : 1;

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Menu Terlaris" />
          <div className="mt-6 space-y-4">
            {bestSellingMenus.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Tidak ada data penjualan</div>
            ) : (
              bestSellingMenus.map((item) => (
                <div key={item.name} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                    {item.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.sales} penjualan</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{currencyFormatter.format(item.revenue)}</p>
                    <p className="text-xs text-emerald-600">Revenue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={<Clock className="h-4 w-4" />} title="Analisis Jam Sibuk" />
          <div className="mt-6">
            {busiestHours.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Tidak ada data pesanan</div>
            ) : (
              <div className="space-y-3">
                {busiestHours.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">{item.hour}</span>
                      <span className="text-sm text-slate-600">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${(item.orders / maxOrders) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{item.orders} pesanan</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Trend Penjualan" />
          <div className="mt-6 flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
            <p className="text-sm text-slate-500">Grafik trend penjualan akan ditampilkan di sini</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountingReports = () => {
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const totalGross = paidOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    const taxPercentage = tenantSettings?.tax_percentage || 0;
    const totalTax = totalGross * (taxPercentage / 100);
    const totalNet = totalGross - totalTax;
    const totalTransactions = paidOrders.length;

    // Group by date for daily breakdown
    const dailyBreakdown = new Map<string, { gross: number; tax: number; net: number; count: number }>();
    paidOrders.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split("T")[0];
      const current = dailyBreakdown.get(date) || { gross: 0, tax: 0, net: 0, count: 0 };
      const orderAmount = parseFloat(order.total_amount);
      const orderTax = orderAmount * (taxPercentage / 100);
      const orderNet = orderAmount - orderTax;
      dailyBreakdown.set(date, {
        gross: current.gross + orderAmount,
        tax: current.tax + orderTax,
        net: current.net + orderNet,
        count: current.count + 1,
      });
    });

    const sortedDailyBreakdown = Array.from(dailyBreakdown.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7); // Show last 7 days

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={<FileText className="h-4 w-4" />} title="Rekonsiliasi Pembayaran" />
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Total Setoran</p>
                  <p className="mt-1 text-xs text-slate-600">Periode terpilih</p>
                </div>
                <p className="text-lg font-bold text-emerald-600">{currencyFormatter.format(totalGross)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Menunggu Verifikasi</p>
                  <p className="mt-1 text-xs text-slate-600">Perlu tindakan</p>
                </div>
                <p className="text-lg font-bold text-amber-600">
                  {currencyFormatter.format(
                    orders
                      .filter((o) => o.payment_status === "waiting_verification")
                      .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={<AlertCircle className="h-4 w-4" />} title="Outstanding (Piutang)" />
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Belum Dibayar</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {orders.filter((o) => o.payment_status === "unpaid").length} pesanan
                  </p>
                </div>
                <p className="text-lg font-bold text-red-600">
                  {currencyFormatter.format(
                    orders
                      .filter((o) => o.payment_status === "unpaid")
                      .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Refund</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {orders.filter((o) => o.payment_status === "refunded").length} pesanan
                  </p>
                </div>
                <p className="text-lg font-bold text-red-600">
                  {currencyFormatter.format(
                    orders
                      .filter((o) => o.payment_status === "refunded")
                      .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Laporan Pajak Lengkap */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Receipt className="h-4 w-4" />} title="Laporan Pajak" />
            <button
              onClick={() => {
                const headers = ["Tanggal", "Jumlah Transaksi", "Penjualan Kotor", "Pajak", "Penjualan Bersih"];
                const rows = sortedDailyBreakdown.map(([date, data]) => [
                  new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }),
                  data.count,
                  formatCurrencyForExcel(data.gross),
                  formatCurrencyForExcel(data.tax),
                  formatCurrencyForExcel(data.net),
                ]);
                // Add summary row
                rows.push([
                  "TOTAL",
                  totalTransactions,
                  formatCurrencyForExcel(totalGross),
                  formatCurrencyForExcel(totalTax),
                  formatCurrencyForExcel(totalNet),
                ]);
                exportSingleSheetExcel(
                  headers,
                  rows,
                  `laporan-pajak-${formatDateForFilename()}.xlsx`,
                  "Laporan Pajak"
                );
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </button>
          </div>

          {/* Summary Cards */}
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
              <p className="text-xs font-medium text-blue-700">Total Transaksi</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">{totalTransactions}</p>
              <p className="mt-1 text-xs text-blue-600">Pesanan lunas</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
              <p className="text-xs font-medium text-emerald-700">Penjualan Kotor</p>
              <p className="mt-2 text-xl font-bold text-emerald-900">{currencyFormatter.format(totalGross)}</p>
              <p className="mt-1 text-xs text-emerald-600">Sebelum pajak</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4">
              <p className="text-xs font-medium text-amber-700">
                Pajak {taxPercentage > 0 ? `${taxPercentage}%` : "(Belum diatur)"}
              </p>
              <p className="mt-2 text-xl font-bold text-amber-900">{currencyFormatter.format(totalTax)}</p>
              <p className="mt-1 text-xs text-amber-600">Total pajak</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
              <p className="text-xs font-medium text-purple-700">Penjualan Bersih</p>
              <p className="mt-2 text-xl font-bold text-purple-900">{currencyFormatter.format(totalNet)}</p>
              <p className="mt-1 text-xs text-purple-600">Setelah pajak</p>
            </div>
          </div>

          {/* Detail Breakdown */}
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Total Penjualan Kena Pajak</p>
                  <p className="mt-1 text-xs text-slate-600">Dasar pengenaan pajak</p>
                </div>
                <p className="text-lg font-bold text-slate-900">{currencyFormatter.format(totalGross)}</p>
              </div>
            </div>
            {taxPercentage > 0 ? (
              <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Pajak Daerah {taxPercentage}%
                      </p>
                      <p className="mt-1 text-xs text-slate-600">Berdasarkan pengaturan tenant</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{currencyFormatter.format(totalTax)}</p>
                  </div>
                </div>
                <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Penjualan Bersih</p>
                      <p className="mt-1 text-xs text-emerald-700">Setelah dikurangi pajak</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-900">{currencyFormatter.format(totalNet)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  Persentase pajak belum diatur. Silakan atur di{" "}
                  <a href="/tenant-admin/settings" className="font-semibold underline">
                    Pengaturan
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Daily Breakdown */}
          {sortedDailyBreakdown.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Breakdown Harian (7 Hari Terakhir)</h3>
              <div className="space-y-2">
                {sortedDailyBreakdown.map(([date, data]) => (
                  <div
                    key={date}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{data.count} transaksi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {currencyFormatter.format(data.gross)}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        <span>Pajak: {currencyFormatter.format(data.tax)}</span>
                        <span>•</span>
                        <span className="text-emerald-600">Bersih: {currencyFormatter.format(data.net)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const displayName = userData?.user.name || "Admin";
  const displayEmail = userData?.user.email || "";

  return (
    <DashboardLayout role="tenant-admin" userEmail={displayEmail} userName={displayName}>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Laporan</h1>
            <p className="mt-2 text-sm text-slate-600">Monitor aktivitas bisnis dan analisis keuangan</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export Semua
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                <Download className="h-4 w-4" />
                Export Excel
              </button>
              <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-lg border border-slate-200 bg-white shadow-lg group-hover:block z-10">
                <button
                  onClick={handleExportFinancial}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Laporan Keuangan
                </button>
                <button
                  onClick={handleExportSales}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Laporan Penjualan
                </button>
                <button
                  onClick={handleExportOperational}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Laporan Operasional
                </button>
                <button
                  onClick={handleExportTax}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Laporan Pajak
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          {reportTabs.length === 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800 mb-1">
                    Tidak Ada Akses Laporan
                  </p>
                  <p className="text-sm text-amber-700 mb-3">
                    Paket Anda tidak memiliki akses ke laporan. Silakan upgrade paket untuk mengakses fitur laporan.
                  </p>
                  <a
                    href="/tenant-admin/subscription"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                  >
                    <Package className="h-4 w-4" />
                    Lihat Paket
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 border-b border-slate-200">
                {reportTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                      activeTab === tab.id
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              {allowedTabs && allowedTabs.length > 0 && (allowedTabs?.length || 0) < allReportTabs.length && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-700">
                    Paket Anda memiliki akses ke {allowedTabs?.length || 0} dari {allReportTabs.length} tab laporan. 
                    <a href="/tenant-admin/subscription" className="font-semibold underline ml-1">
                      Upgrade paket
                    </a> untuk akses lengkap.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Report Content */}
        <div className="space-y-6">
          {activeTab === "financial" && renderFinancialReports()}
          {activeTab === "sales" && renderSalesReports()}
          {activeTab === "operational" && renderOperationalReports()}
          {activeTab === "analytics" && renderAnalyticsReports()}
          {activeTab === "accounting" && renderAccountingReports()}
        </div>

        {/* WiFi Input Modal */}
        <WifiInputModal
          isOpen={showWifiModal}
          onClose={() => {
            setShowWifiModal(false);
            setSelectedOrder(null);
          }}
          onConfirm={handleWifiConfirm}
        />

        {/* Invoice Printer */}
        {showInvoice && selectedOrder && (
          <InvoicePrinter
            orderId={selectedOrder!.id}
            data={{
              orderCode: selectedOrder!.order_code,
              tableNumber: selectedOrder!.table?.number || "N/A",
              createdAt: selectedOrder!.created_at,
              paymentMethod: selectedOrder!.payment_method,
              paymentStatus: selectedOrder!.payment_status,
              items:
                selectedOrder!.items?.map((item) => {
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
              totalAmount: parseFloat(selectedOrder!.total_amount),
              tenantName: tenantSettings?.name || userData?.tenant?.name || "",
              tenantAddress: tenantSettings?.address || "",
              tenantPhone: tenantSettings?.phone || "",
              wifiName: wifiName || undefined,
              wifiPassword: wifiPassword || undefined,
            }}
            onPrintComplete={handlePrintComplete}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

