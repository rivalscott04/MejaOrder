"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, CreditCard } from "lucide-react";
import { Footer } from "@/components/shared/footer";

type PaymentStatus = "processing" | "success" | "failed" | "pending";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>("processing");
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    // Get callback parameters from URL
    const reference = searchParams.get("reference");
    const statusParam = searchParams.get("status");
    const orderCodeParam = searchParams.get("order_code");

    if (orderCodeParam) {
      setOrderCode(orderCodeParam);
    }

    // Simulate processing payment callback
    const processCallback = async () => {
      try {
        // In production, this should call your backend API to verify the payment
        // const response = await fetch(`/api/payment/callback?reference=${reference}&status=${statusParam}`);
        // const data = await response.json();

        // For now, simulate based on status parameter
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (statusParam === "PAID" || statusParam === "paid") {
          setStatus("success");
          setMessage("Pembayaran berhasil! Pesanan Anda sedang diproses.");
        } else if (statusParam === "FAILED" || statusParam === "failed") {
          setStatus("failed");
          setMessage("Pembayaran gagal. Silakan coba lagi atau gunakan metode pembayaran lain.");
        } else {
          setStatus("pending");
          setMessage("Pembayaran sedang diproses. Silakan tunggu konfirmasi.");
        }
      } catch (error) {
        setStatus("failed");
        setMessage("Terjadi kesalahan saat memproses pembayaran. Silakan hubungi customer service.");
      }
    };

    if (reference || statusParam) {
      processCallback();
    } else {
      setStatus("failed");
      setMessage("Parameter pembayaran tidak valid.");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Status Card */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="text-center">
              {/* Icon */}
              <div className="mb-5 sm:mb-6 flex justify-center">
                {status === "processing" && (
                  <div className="rounded-full bg-blue-50 p-3 sm:p-4">
                    <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600" />
                  </div>
                )}
                {status === "success" && (
                  <div className="rounded-full bg-emerald-50 p-3 sm:p-4">
                    <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600" />
                  </div>
                )}
                {(status === "failed" || status === "pending") && (
                  <div className="rounded-full bg-orange-50 p-3 sm:p-4">
                    {status === "failed" ? (
                      <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600" />
                    ) : (
                      <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-orange-600" />
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl font-bold text-slate-900">
                {status === "processing" && "Memproses Pembayaran..."}
                {status === "success" && "Pembayaran Berhasil!"}
                {status === "failed" && "Pembayaran Gagal"}
                {status === "pending" && "Menunggu Konfirmasi"}
              </h1>

              {/* Message */}
              <p className="mb-5 sm:mb-6 text-base sm:text-lg text-slate-600 px-2">
                {message || "Mohon tunggu sebentar..."}
              </p>

              {/* Order Code */}
              {orderCode && (
                <div className="mb-5 sm:mb-6 rounded-lg bg-slate-50 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-slate-600">Kode Pesanan</p>
                  <p className="mt-1 text-base sm:text-lg font-semibold text-slate-900 break-all">{orderCode}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                {status === "success" && (
                  <>
                    <Link
                      href="/"
                      className="rounded-xl bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 text-center"
                    >
                      Kembali ke Beranda
                    </Link>
                    {orderCode && (
                      <Link
                        href={`/order/${orderCode}`}
                        className="rounded-xl border-2 border-slate-300 bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 text-center"
                      >
                        Lihat Detail Pesanan
                      </Link>
                    )}
                  </>
                )}

                {status === "failed" && (
                  <>
                    <Link
                      href="/contact"
                      className="rounded-xl bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 text-center"
                    >
                      Hubungi Customer Service
                    </Link>
                    <button
                      onClick={() => router.back()}
                      className="rounded-xl border-2 border-slate-300 bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      Coba Lagi
                    </button>
                  </>
                )}

                {status === "pending" && (
                  <>
                    <Link
                      href="/"
                      className="rounded-xl bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 text-center"
                    >
                      Kembali ke Beranda
                    </Link>
                    <Link
                      href="/contact"
                      className="rounded-xl border-2 border-slate-300 bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 text-center"
                    >
                      Hubungi Customer Service
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-5 sm:mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <h3 className="mb-2 text-sm sm:text-base font-semibold text-slate-900">
              Butuh Bantuan?
            </h3>
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-slate-600">
              Jika Anda mengalami masalah dengan pembayaran, tim customer service kami siap membantu.
            </p>
            <Link
              href="/contact"
              className="text-xs sm:text-sm font-medium text-emerald-600 transition hover:underline"
            >
              Hubungi Customer Service →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}

