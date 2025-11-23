"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  Store,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { currencyFormatter, formatOrderCode } from "@/lib/utils";
import Link from "next/link";

const statusSteps = [
  { key: "pending", label: "Pesanan dibuat" },
  { key: "accepted", label: "Pesanan diterima kasir" },
  { key: "preparing", label: "Sedang disiapkan" },
  { key: "ready", label: "Siap diantar" },
  { key: "completed", label: "Selesai" },
];

const statusKeyToIndex = statusSteps.reduce<Record<string, number>>((acc, step, index) => {
  acc[step.key] = index;
  return acc;
}, {});

type OrderSummary = {
  order_code: string;
  payment_method: string;
  payment_status: "unpaid" | "waiting_verification" | "paid" | "failed" | "refunded";
  order_status: "pending" | "accepted" | "preparing" | "ready" | "completed" | "canceled";
  total_amount: number;
  customer_note?: string | null;
  items: Array<{
    menu_id: number;
    menu_name: string;
    qty: number;
    subtotal: number;
    note?: string | null;
    options: Array<{
      group: string;
      label: string;
      extra_price: number;
    }>;
  }>;
};

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const qrToken = params.qrToken as string;
  const orderCode = params.orderCode as string;
  
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "";
  const isMockMode = !apiBaseUrl;

  const handleCopyOrderCode = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.order_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const fetchOrder = useCallback(async () => {
    if (!orderCode) {
      setIsLoading(false);
      return;
    }

    // Handle mock mode - generate mock order data
    if (isMockMode) {
      if (orderCode.startsWith("MOCK-")) {
        // Try to get order data from localStorage (set by customer-experience)
        const storedOrderData = localStorage.getItem(`mock_order_${orderCode}`);
        if (storedOrderData) {
          try {
            const parsedOrder = JSON.parse(storedOrderData);
            setOrder(parsedOrder);
            setError(null);
          } catch {
            // Fallback to default mock order
            setOrder({
              order_code: orderCode,
              payment_method: "cash",
              payment_status: "unpaid",
              order_status: "pending",
              total_amount: 0,
              items: [],
            });
          }
        } else {
          // Fallback to default mock order
          setOrder({
            order_code: orderCode,
            payment_method: "cash",
            payment_status: "unpaid",
            order_status: "pending",
            total_amount: 0,
            items: [],
          });
        }
        setError(null);
      } else {
        setError("Pesanan tidak ditemukan.");
      }
      setIsLoading(false);
      return;
    }

    if (!apiBaseUrl) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/public/${tenantSlug}/orders/${orderCode}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Pesanan tidak ditemukan.");
        } else {
          setError("Gagal memuat data pesanan.");
        }
        setIsLoading(false);
        return;
      }

      const data: OrderSummary = await response.json();
      setOrder(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError("Terjadi kesalahan saat memuat data pesanan.");
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, tenantSlug, orderCode]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Poll order status if order is not completed or canceled (skip for mock mode)
  useEffect(() => {
    if (isMockMode || !apiBaseUrl || !orderCode || !order) {
      return;
    }

    if (["completed", "canceled"].includes(order.order_status)) {
      return;
    }

    const interval = setInterval(fetchOrder, 6000);
    return () => clearInterval(interval);
  }, [isMockMode, apiBaseUrl, orderCode, order, fetchOrder]);

  const currentIndex = order ? statusSteps.findIndex((step) => step.key === order.order_status) : 0;
  const effectiveStatus = order 
    ? statusSteps.find((step) => step.key === order.order_status) ?? statusSteps[0]
    : statusSteps[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-emerald-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-card text-center">
            <p className="text-rose-600 mb-4">{error || "Pesanan tidak ditemukan"}</p>
            <Link
              href={`/o/${tenantSlug}/t/${qrToken}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/o/${tenantSlug}/t/${qrToken}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Menu
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <Store className="h-4 w-4 text-emerald-600" />
            <span>{tenantSlug}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span>Status Pesanan</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Status Pesanan</h1>
        </div>

        {/* Order Code Card - Prominent Display */}
        <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Kode Pesanan
              </p>
              <p className="text-2xl font-bold text-slate-900 font-mono tracking-wider">
                {formatOrderCode(order.order_code)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Simpan kode ini untuk crosscheck dengan kasir atau admin
              </p>
            </div>
            <button
              onClick={handleCopyOrderCode}
              className="ml-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:border-emerald-400 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Order Status Card */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card mb-6">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-emerald-600" />
              Status pesanan
            </div>
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
              {effectiveStatus.label}
            </span>
          </div>

          <div className="mb-4 space-y-2 text-xs text-slate-600 sm:grid sm:grid-cols-2 sm:gap-2 md:flex md:items-center md:justify-between md:space-y-0">
            <p className="font-semibold text-slate-900">Kode: {formatOrderCode(order.order_code)}</p>
            <p>
              Pembayaran: <span className="font-semibold text-slate-900 capitalize">{order.payment_status.replace("_", " ")}</span>
            </p>
            <p className="sm:col-span-2 md:col-span-1">
              Total: <span className="font-semibold text-slate-900">{currencyFormatter.format(order.total_amount)}</span>
            </p>
          </div>

          {/* Progress Timeline */}
          <div className="mt-6">
            <div className="relative flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const isActive = step.key === order.order_status;
                const isPast = currentIndex > index; // Status yang sudah terlewat
                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                        isActive
                          ? "border-emerald-700 bg-emerald-600 text-white shadow-md shadow-emerald-200"
                          : isPast
                            ? "border-slate-300 bg-slate-100 text-slate-500"
                            : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isActive ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <p
                      className={`mt-2 w-20 text-[11px] font-semibold transition-colors ${
                        isActive
                          ? "text-emerald-700"
                          : isPast
                            ? "text-slate-500"
                            : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-card">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Detail Pesanan</h2>
          <div className="space-y-2.5 sm:space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                {/* Mobile: Stacked Layout */}
                <div className="block sm:hidden space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-semibold text-slate-900 leading-tight">
                        {item.menu_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">× {item.qty}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {currencyFormatter.format(item.subtotal)}
                    </p>
                  </div>
                  {item.options && item.options.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {item.options.map((opt, optIdx) => (
                          <span key={optIdx}>
                            {opt.label}
                            {opt.extra_price > 0 && (
                              <span className="text-emerald-600"> (+{currencyFormatter.format(opt.extra_price)})</span>
                            )}
                            {optIdx < item.options.length - 1 && ", "}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                  {item.note && (
                    <div className="pt-1.5 border-t border-slate-100">
                      <p className="text-[11px] text-emerald-600">
                        <span className="font-semibold">Catatan:</span> {item.note}
                      </p>
                    </div>
                  )}
                </div>

                {/* Desktop/Tablet: Horizontal Layout */}
                <div className="hidden sm:block">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.menu_name} × {item.qty}
                      </p>
                      {item.options && item.options.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {item.options.map((opt, optIdx) => (
                            <span key={optIdx}>
                              {opt.label}
                              {opt.extra_price > 0 && (
                                <span className="text-emerald-600"> (+{currencyFormatter.format(opt.extra_price)})</span>
                              )}
                              {optIdx < item.options.length - 1 && ", "}
                            </span>
                          ))}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-xs text-emerald-600 mt-1.5">
                          <span className="font-semibold">Catatan:</span> {item.note}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {currencyFormatter.format(item.subtotal)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm sm:text-base font-bold text-slate-900">Total Pembayaran</p>
              <p className="text-base sm:text-lg font-bold text-emerald-600">{currencyFormatter.format(order.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <Link
            href={`/o/${tenantSlug}/t/${qrToken}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Pesan Lagi
          </Link>
        </div>
      </div>
    </div>
  );
}

