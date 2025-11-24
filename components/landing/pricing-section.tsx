"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { fetchPublicPlans, type Plan } from "@/lib/api-client";

export function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        const response = await fetchPublicPlans();
        setPlans(response.data || []);
      } catch (err) {
        console.error("Failed to load plans:", err);
        setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  const formatPrice = (price: string | null) => {
    if (!price) return "Custom";
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "Custom";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const getPlanBadgeColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("basic")) {
      return "bg-slate-100 text-slate-700";
    }
    if (name.includes("pro")) {
      return "bg-emerald-100 text-emerald-700";
    }
    if (name.includes("enterprise")) {
      return "bg-purple-100 text-purple-700";
    }
    return "bg-slate-100 text-slate-700";
  };

  const getPlanBorderColor = (planName: string, index: number) => {
    const name = planName.toLowerCase();
    if (name.includes("pro") || index === 1) {
      return "border-emerald-500";
    }
    return "border-slate-200";
  };

  const isFeatured = (planName: string, index: number) => {
    const name = planName.toLowerCase();
    return name.includes("pro") || index === 1;
  };

  if (loading) {
    return (
      <section className="bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
              Paket Harga
            </h2>
            <p className="text-lg text-slate-600">
              Tersedia dalam model berlangganan bulanan tanpa kontrak panjang
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm animate-pulse"
              >
                <div className="h-6 w-20 bg-slate-200 rounded-lg mb-4"></div>
                <div className="h-12 w-32 bg-slate-200 rounded mb-4"></div>
                <div className="h-4 w-40 bg-slate-200 rounded mb-6"></div>
                <div className="space-y-3 mb-8">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-4 bg-slate-200 rounded"></div>
                  ))}
                </div>
                <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || plans.length === 0) {
    // Fallback to static pricing if API fails
    return (
      <section className="bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
              Paket Harga
            </h2>
            <p className="text-lg text-slate-600">
              Tersedia dalam model berlangganan bulanan tanpa kontrak panjang
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Basic Plan */}
            <article className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4">
                <div className="mb-2 inline-flex rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  BASIC
                </div>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-slate-900">Rp 99.000</span>
                <span className="text-slate-600">/bulan</span>
              </div>
              <p className="mb-6 text-sm text-slate-600">Cocok untuk kedai kecil</p>
              <ul className="mb-8 space-y-3">
                {[
                  "Hingga 20 menu",
                  "10 meja",
                  "Kasir dashboard",
                  "Pembayaran cash & transfer",
                  "QR Scan ordering",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                aria-label="Daftar Paket Basic"
              >
                Mulai Sekarang
              </Link>
            </article>

            {/* Pro Plan - Featured */}
            <article className="relative rounded-2xl border-2 border-emerald-500 bg-white p-8 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white">
                  PALING LARIS
                </span>
              </div>
              <div className="mb-4">
                <div className="mb-2 inline-flex rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  PRO
                </div>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-slate-900">Rp 199.000</span>
                <span className="text-slate-600">/bulan</span>
              </div>
              <p className="mb-6 text-sm text-slate-600">Untuk cafe yang ingin fitur lengkap</p>
              <ul className="mb-8 space-y-3">
                {[
                  "Menu & meja unlimited",
                  "Support QRIS",
                  "Laporan Penjualan",
                  "Manajemen variasi menu",
                  "Prioritas support",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full rounded-xl bg-emerald-500 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600"
                aria-label="Daftar Paket Pro"
              >
                Mulai Sekarang
              </Link>
            </article>

            {/* Enterprise Plan */}
            <article className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4">
                <div className="mb-2 inline-flex rounded-lg bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                  ENTERPRISE
                </div>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-slate-900">Custom</span>
              </div>
              <p className="mb-6 text-sm text-slate-600">Untuk jaringan resto & franchise</p>
              <ul className="mb-8 space-y-3">
                {[
                  "Multi-cabang",
                  "Custom domain",
                  "Integrasi API",
                  "SLA premium",
                  "Dedicated support",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                aria-label="Hubungi Sales untuk Paket Enterprise"
              >
                Hubungi Sales
              </Link>
            </article>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            Paket Harga
          </h2>
          <p className="text-lg text-slate-600">
            Tersedia dalam model berlangganan bulanan tanpa kontrak panjang
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => {
            const features = plan.features_json || [];
            const isPro = isFeatured(plan.name, index);
            const price = formatPrice(plan.price_monthly);

            return (
              <article
                key={plan.id}
                className={`relative rounded-2xl border-2 ${getPlanBorderColor(
                  plan.name,
                  index
                )} bg-white p-8 ${isPro ? "shadow-xl" : "shadow-sm"}`}
              >
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white">
                      PALING LARIS
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <div
                    className={`mb-2 inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${getPlanBadgeColor(
                      plan.name
                    )}`}
                  >
                    {plan.name.toUpperCase()}
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-900">{price}</span>
                  {plan.price_monthly && (
                    <span className="text-slate-600">/bulan</span>
                  )}
                </div>
                <p className="mb-6 text-sm text-slate-600">
                  {plan.description || "Paket lengkap untuk kebutuhan bisnis Anda"}
                </p>
                <ul className="mb-8 space-y-3">
                  {features.length > 0 ? (
                    features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">Fitur lengkap sesuai kebutuhan</li>
                  )}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full rounded-xl px-6 py-3 text-center font-semibold transition ${
                    isPro
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                      : "border-2 border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                  aria-label={`Daftar Paket ${plan.name}`}
                >
                  {plan.name.toLowerCase().includes("enterprise") ? "Hubungi Sales" : "Mulai Sekarang"}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

