"use client";

import { useState } from "react";
import { X, Printer, AlertTriangle } from "lucide-react";
import { SectionTitle } from "@/components/shared/section-title";
import { PaymentMethodBadge } from "@/components/shared/payment-method-badge";
import { LayoutDashboard } from "lucide-react";
import { currencyFormatter, formatTime, cn, formatOrderCode } from "@/lib/utils";
import { getBackendUrl } from "@/lib/api-client";
import type { Order } from "@/lib/api-client";

type OrderDetailViewProps = {
  order: Order;
  onClose?: () => void;
  onStatusUpdate: (status: "accepted" | "preparing" | "ready" | "completed") => Promise<void>;
  onPaymentUpdate: () => Promise<void>;
  onPrintInvoice?: () => void;
  isUpdating: boolean;
  viewMode?: "modal" | "bottom-sheet" | "fullscreen";
};

export function OrderDetailView({
  order,
  onClose,
  onStatusUpdate,
  onPaymentUpdate,
  onPrintInvoice,
  isUpdating,
  viewMode = "bottom-sheet",
}: OrderDetailViewProps) {
  const handleStatusUpdate = async (status: "accepted" | "preparing" | "ready" | "completed") => {
    await onStatusUpdate(status);
  };

  const content = (
    <div className="space-y-4">
      {onClose && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <SectionTitle icon={<LayoutDashboard className="h-4 w-4" />} title="Detail Pesanan" />
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {order.order_code} Meja {order.table?.number || "-"}
          </p>
          {order.customer_name && (
            <p className="text-sm font-semibold text-emerald-600 mt-1">
              {order.customer_name}
            </p>
          )}
          <p className="text-xs text-slate-500">{formatTime(order.created_at)}</p>
        </div>

        {/* Payment Info */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">Metode Pembayaran</p>
          <div className="mt-1">
            <PaymentMethodBadge method={order.payment_method} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">Status Pembayaran</p>
          <PaymentStatusBadge status={order.payment_status} />
          
          {/* Payment Proof Preview */}
          {order.payments && order.payments.length > 0 && (
            <div className="mt-4 space-y-2">
              {order.payments
                .filter((payment) => payment.proof_url)
                .map((payment) => (
                  <PaymentProofImage key={payment.id} payment={payment} />
                ))}
            </div>
          )}
        </div>

        {/* Items */}
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500">Daftar Item</p>
          <div className="space-y-2">
            {order.items?.map((item, idx) => (
              <div key={idx} className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">
                  {item.menu_name_snapshot} × {item.qty}
                </p>
                {item.options && item.options.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    {item.options
                      .map(
                        (opt) =>
                          `${opt.option_group_name_snapshot}: ${opt.option_item_label_snapshot}${parseFloat(opt.extra_price_snapshot) > 0 ? ` (+${currencyFormatter.format(parseFloat(opt.extra_price_snapshot))})` : ""}`
                      )
                      .join(", ")}
                  </p>
                )}
                {item.item_note && (
                  <p className="mt-1 text-xs italic text-slate-500">Catatan: {item.item_note}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Total</p>
            <p className="text-lg font-bold text-slate-900">
              {currencyFormatter.format(parseFloat(order.total_amount))}
            </p>
          </div>
        </div>

        {/* Invoice Warning */}
        {(order.order_status === "ready" || order.order_status === "completed") &&
          !order.invoice_printed_at &&
          order.payment_status === "paid" && (
            <div className="rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-500 p-2 flex-shrink-0 animate-pulse">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-amber-900 flex items-center gap-2">
                    PERINGATAN: Invoice Belum Dicetak
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-amber-900 leading-relaxed">
                    {order.order_status === "completed" 
                      ? "Pesanan sudah selesai tetapi invoice belum dicetak. Segera cetak invoice untuk pelanggan!"
                      : "PENTING: Invoice harus dicetak sebelum mengantar pesanan ke customer. Invoice dan makanan harus diberikan bersamaan."}
                  </p>
                  {onPrintInvoice && (
                    <button
                      onClick={onPrintInvoice}
                      className="mt-3 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-bold text-white transition shadow-md hover:shadow-lg"
                    >
                      Cetak Invoice Sekarang
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Actions */}
        <div className="space-y-2">
          {order.payment_status !== "paid" && (
            <button
              onClick={onPaymentUpdate}
              disabled={isUpdating}
              className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Memproses..." : "Tandai Sudah Bayar"}
            </button>
          )}
          {order.payment_status === "paid" && onPrintInvoice && (
            <button
              onClick={onPrintInvoice}
              disabled={isUpdating}
              className="w-full rounded-xl border-2 border-blue-500 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              {order.invoice_printed_at ? "Cetak Ulang Invoice" : "Cetak Invoice"}
            </button>
          )}
          <div className="space-y-2">
            {order.order_status === "pending" && (
              <button
                onClick={() => handleStatusUpdate("accepted")}
                disabled={isUpdating}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Terima Pesanan
              </button>
            )}
            {order.order_status === "accepted" && (
              <button
                onClick={() => handleStatusUpdate("preparing")}
                disabled={isUpdating}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sedang Disiapkan
              </button>
            )}
            {order.order_status === "preparing" && (
              <button
                onClick={() => handleStatusUpdate("ready")}
                disabled={isUpdating}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siap Diantar
              </button>
            )}
            {order.order_status === "ready" && (
              <button
                onClick={() => handleStatusUpdate("completed")}
                disabled={isUpdating}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tandai                 Tandai Selesai
              </button>
            )}
            {(order.order_status === "completed" || order.order_status === "canceled") && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-500">
                {order.order_status === "completed" ? "Pesanan Selesai" : "Pesanan Dibatalkan"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render based on view mode
  if (viewMode === "modal") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  if (viewMode === "bottom-sheet") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div
          className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  // Fullscreen
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-6">
      <div className="mx-auto max-w-4xl">{content}</div>
    </div>
  );
}

function PaymentProofImage({ payment }: { payment: { id: number; proof_url?: string | null | undefined; verified_at?: string | null; verifier?: { id: number; name: string; email: string } | null } }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Get image URL - use API endpoint for cashier/admin access
  const getImageUrl = () => {
    if (!payment.proof_url && !payment.id) return '';
    
    // Use API endpoint for payment proof (more reliable than direct storage URL)
    const backendUrl = getBackendUrl();
    if (backendUrl && payment.id) {
      const base = backendUrl.replace(/\/$/, '');
      return `${base}/api/cashier/payments/${payment.id}/proof`;
    }
    
    // Fallback to original URL if API endpoint not available
    const url = payment.proof_url;
    if (!url) return '';
    
    // If URL is already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a relative path starting with /, prepend backend URL
    if (url.startsWith('/')) {
      if (backendUrl) {
        const base = backendUrl.replace(/\/$/, '');
        return `${base}${url}`;
      }
      
      // Fallback: use current origin
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${url}`;
      }
      
      return url;
    }
    
    // For other relative paths, try to construct absolute URL
    if (backendUrl) {
      const base = backendUrl.replace(/\/$/, '');
      return `${base}/${url}`;
    }
    
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${url}`;
    }
    
    return url;
  };

  const imageUrl = getImageUrl();

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500">Bukti Pembayaran</p>
      <div className="relative rounded-lg border border-slate-200 bg-white overflow-hidden min-h-[120px] flex items-center justify-center">
        {imageError ? (
          <div className="p-4 text-center text-xs text-slate-500">
            <p>Gagal memuat gambar</p>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition"
            >
              Buka di tab baru
            </a>
          </div>
        ) : (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <p className="text-xs text-slate-400">Memuat gambar...</p>
              </div>
            )}
            <img
              src={imageUrl}
              alt="Bukti pembayaran"
              className={cn(
                "w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition",
                imageLoading && "opacity-0"
              )}
              onClick={() => window.open(imageUrl, '_blank')}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          </>
        )}
      </div>
      {payment.verified_at && payment.verifier && (
        <p className="text-xs text-slate-500">
          Diverifikasi oleh {payment.verifier.name} pada {new Date(payment.verified_at).toLocaleString('id-ID')}
        </p>
      )}
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    unpaid: "bg-slate-100 text-slate-700",
    waiting_verification: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    refunded: "bg-slate-100 text-slate-700",
  };
  
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      unpaid: "Belum dibayar",
      waiting_verification: "Menunggu verifikasi",
      paid: "Lunas",
      failed: "Pembayaran gagal",
      refunded: "Dikembalikan",
    };
    return statusMap[status] || status;
  };
  
  return (
    <span
      className={cn(
        "mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold",
        variants[status] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

