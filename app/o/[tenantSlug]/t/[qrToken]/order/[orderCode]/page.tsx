"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  Store,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import { currencyFormatter, formatOrderCode } from "@/lib/utils";
import Link from "next/link";

// Simplified status steps for customer view (only 3 steps)
const customerStatusSteps = [
  { key: "accepted", label: "Diterima" },
  { key: "processed", label: "Diproses" },
  { key: "completed", label: "Selesai" },
];

// Map backend status to customer-facing status
const mapBackendStatusToCustomerStatus = (backendStatus: string): string => {
  if (backendStatus === "pending") return "accepted"; // Show as waiting for acceptance (will show as first step but not active)
  if (backendStatus === "accepted") return "accepted";
  if (backendStatus === "preparing" || backendStatus === "ready") return "processed";
  if (backendStatus === "completed") return "completed";
  if (backendStatus === "canceled") return "accepted"; // Show canceled orders at first step
  return "accepted"; // Default fallback
};

// Get display label for status badge
const getStatusDisplayLabel = (backendStatus: string): string => {
  if (backendStatus === "pending") return "Menunggu";
  if (backendStatus === "accepted") return "Diterima";
  if (backendStatus === "preparing" || backendStatus === "ready") return "Diproses";
  if (backendStatus === "completed") return "Selesai";
  if (backendStatus === "canceled") return "Dibatalkan";
  return "Menunggu";
};

const statusKeyToIndex = customerStatusSteps.reduce<Record<string, number>>((acc, step, index) => {
  acc[step.key] = index;
  return acc;
}, {});

const getPaymentStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    unpaid: "Belum dibayar",
    waiting_verification: "Menunggu verifikasi",
    paid: "Lunas",
    failed: "Pembayaran gagal",
    refunded: "Dikembalikan",
  };
  return statusMap[status] || status;
};

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hasShownCelebrationRef = useRef(false);
  const previousStatusRef = useRef<string | null>(null);
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
        // Check if we're in browser environment to avoid hydration issues
        const storedOrderData = typeof window !== 'undefined' 
          ? localStorage.getItem(`mock_order_${orderCode}`)
          : null;
        if (storedOrderData) {
          try {
            const parsedOrder = JSON.parse(storedOrderData);
            const previousStatus = previousStatusRef.current;
            setOrder(parsedOrder);
            // Check if status is completed for mock mode
            if (
              parsedOrder.order_status === "completed" && 
              previousStatus !== "completed" && 
              !hasShownCelebrationRef.current
            ) {
              setShowCelebration(true);
              setShowThankYouModal(true);
              setHasShownCelebration(true);
              hasShownCelebrationRef.current = true;
              setTimeout(() => setShowCelebration(false), 3000);
            }
            previousStatusRef.current = parsedOrder.order_status;
            setError(null);
          } catch {
            // Fallback to default mock order
            const defaultOrder: OrderSummary = {
              order_code: orderCode,
              payment_method: "cash",
              payment_status: "unpaid",
              order_status: "pending",
              total_amount: 0,
              items: [],
            };
            setOrder(defaultOrder);
          }
        } else {
          // Fallback to default mock order
          const defaultOrder: OrderSummary = {
            order_code: orderCode,
            payment_method: "cash",
            payment_status: "unpaid",
            order_status: "pending",
            total_amount: 0,
            items: [],
          };
          const previousStatus = previousStatusRef.current;
          setOrder(defaultOrder);
          // Check if status is completed for mock mode
          if (
            defaultOrder.order_status === "completed" && 
            previousStatus !== "completed" && 
            !hasShownCelebrationRef.current
          ) {
            setShowCelebration(true);
            setShowThankYouModal(true);
            setHasShownCelebration(true);
            hasShownCelebrationRef.current = true;
            setTimeout(() => setShowCelebration(false), 3000);
          }
          previousStatusRef.current = defaultOrder.order_status;
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
      const previousStatus = previousStatusRef.current;
      setOrder(data);
      setError(null);
      
      // Trigger celebration and modal when status changes to completed (from non-completed)
      if (
        data.order_status === "completed" && 
        previousStatus !== "completed" && 
        !hasShownCelebrationRef.current
      ) {
        setShowCelebration(true);
        setShowThankYouModal(true);
        setHasShownCelebration(true);
        hasShownCelebrationRef.current = true;
        // Hide celebration after animation
        setTimeout(() => setShowCelebration(false), 3000);
      }
      previousStatusRef.current = data.order_status;
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError("Terjadi kesalahan saat memuat data pesanan.");
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, tenantSlug, orderCode, isMockMode]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Map backend status to customer-facing status
  const customerStatus = order ? mapBackendStatusToCustomerStatus(order.order_status) : "accepted";
  const currentIndex = customerStatusSteps.findIndex((step) => step.key === customerStatus);
  const effectiveStatus = customerStatusSteps.find((step) => step.key === customerStatus) ?? customerStatusSteps[0];
  
  // For pending status, show timeline but don't mark any step as active yet
  const isPending = order?.order_status === "pending";
  const displayStatusLabel = order ? getStatusDisplayLabel(order.order_status) : "Menunggu";

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

  const isCompleted = order?.order_status === "completed";

  // Show modal if completed when first loading (not from status change)
  useEffect(() => {
    // Only run on client-side after initial render to avoid hydration issues
    if (!isMounted || typeof window === 'undefined') return;
    
    if (isCompleted && !hasShownCelebrationRef.current && order && previousStatusRef.current === null) {
      // First time loading with completed status
      setShowThankYouModal(true);
      setHasShownCelebration(true);
      hasShownCelebrationRef.current = true;
    }
  }, [isMounted, isCompleted, order]);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Celebration Confetti Animation - Only render on client after mount */}
      {isMounted && showCelebration && <ConfettiAnimation />}
      
      {/* Thank You Modal - Only render on client after mount to avoid hydration issues */}
      {isMounted && showThankYouModal && isCompleted && (
        <ThankYouModal 
          onClose={() => setShowThankYouModal(false)} 
          orderCode={order?.order_code || ""}
        />
      )}
      
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card mb-6">
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
              className="ml-4 flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:border-slate-400 active:scale-95"
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
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              order?.order_status === "canceled" 
                ? "bg-rose-600 text-white"
                : order?.order_status === "completed"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-600 text-white"
            }`}>
              {displayStatusLabel}
            </span>
          </div>

          <div className="mb-4 space-y-2 text-xs text-slate-600 sm:grid sm:grid-cols-2 sm:gap-2 md:flex md:items-center md:justify-between md:space-y-0">
            <p className="font-semibold text-slate-900">Kode: {formatOrderCode(order.order_code)}</p>
            <p>
              Status Pembayaran: <span className="font-semibold text-slate-900">{getPaymentStatusLabel(order.payment_status)}</span>
            </p>
            <p className="sm:col-span-2 md:col-span-1">
              Total: <span className="font-semibold text-slate-900">{currencyFormatter.format(order.total_amount)}</span>
            </p>
          </div>

          {/* Progress Timeline - Simplified 3 steps for customer */}
          <div className="mt-6">
            <div className="relative flex items-center justify-between">
              {customerStatusSteps.map((step, index) => {
                // For pending status, don't mark any step as active
                const isActive = !isPending && step.key === customerStatus;
                const isPast = !isPending && currentIndex > index; // Status yang sudah terlewat
                return (
                  <div key={step.key} className="flex flex-col items-center text-center flex-1">
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
                      className={`mt-2 text-xs font-semibold transition-colors ${
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {isCompleted ? (
              <>
                <Sparkles className="h-4 w-4" />
                Pesan Lagi
              </>
            ) : (
              "Pesan Lagi"
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

// Thank You Modal Component
function ThankYouModal({ onClose, orderCode }: { onClose: () => void; orderCode: string }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    // Only run on client-side to avoid hydration issues
    if (typeof window === 'undefined') return;
    
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="w-full max-w-md rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-8 shadow-2xl animate-[fadeInScale_0.5s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 transition hover:bg-white/80 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-6 shadow-xl">
              <CheckCircle2 className="h-16 w-16 text-white" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-emerald-900">
              Pesanan Selesai! 
            </h2>
            <p className="text-base text-emerald-800 leading-relaxed">
              Terima kasih sudah memesan! Pesanan Anda sudah siap.
            </p>
            <p className="text-sm text-emerald-700">
              Selamat menikmati dan semoga harimu menyenangkan!
            </p>
          </div>

          {/* Order Code */}
          <div className="w-full rounded-2xl border border-emerald-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
              Kode Pesanan
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {formatOrderCode(orderCode)}
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5" />
              Mengerti, Terima Kasih!
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Confetti Animation Component
function ConfettiAnimation() {
  const confettiCount = 50;
  const [confetti] = useState(() => 
    Array.from({ length: confettiCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      initialRotation: Math.random() * 360,
      color: ['bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600', 'bg-yellow-400', 'bg-yellow-500', 'bg-amber-400', 'bg-amber-500'][Math.floor(Math.random() * 7)],
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((item) => (
        <div
          key={item.id}
          className={`absolute w-2 h-2 ${item.color} rounded-sm`}
          style={{
            left: `${item.left}%`,
            top: '-10px',
            animation: `confettiFall ${item.duration}s ease-in ${item.delay}s forwards`,
            transform: `rotate(${item.initialRotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

