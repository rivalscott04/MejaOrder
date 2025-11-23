"use client";

import Link from "next/link";
import {
  QrCode,
  TrendingUp,
  DollarSign,
  Sparkles,
  Server,
  Smartphone,
  Menu,
  CreditCard,
  Monitor,
  Table,
  Users,
  Crown,
  CheckCircle2,
  Star,
  BarChart3,
  Printer,
  LogIn,
} from "lucide-react";
import { Footer } from "@/components/shared/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">MejaOrder</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              <QrCode className="h-4 w-4" />
              <span>Solusi QR Ordering Modern untuk Cafe & Resto</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Revolusi Pemesanan Cafe & Resto Langsung dari Meja Pelanggan
            </h1>
            <p className="mb-8 text-lg text-slate-300 md:text-xl">
              Dengan MejaOrder, pelanggan cukup scan QR, pilih menu, bayar, dan pesanan otomatis masuk ke sistem. Cepat, modern, dan tanpa antre.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30"
              >
                Mulai Coba Gratis 14 Hari
              </Link>
              <Link
                href="/demo"
                className="rounded-xl border-2 border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Lihat Demo Sistem
              </Link>
            </div>

            {/* Hero Highlights */}
            <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                { icon: QrCode, label: "QR Ordering" },
                { icon: Menu, label: "Manajemen Menu & Variasi" },
                { icon: Monitor, label: "Dashboard Kasir Real-time" },
                { icon: CreditCard, label: "Pembayaran Cash, Transfer & QRIS" },
                { icon: Users, label: "Multi-Tenant (SaaS)" },
                { icon: BarChart3, label: "Laporan Penjualan Otomatis" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <item.icon className="h-6 w-6 text-emerald-400" />
                  <span className="text-xs text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
              Mengapa Cafe & Resto Beralih ke MejaOrder?
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Tingkatkan Omzet 20–40%",
                description: "Pelanggan pesan lebih cepat tanpa menunggu pelayan atau kasir.",
                bgColor: "bg-emerald-50",
                textColor: "text-emerald-600",
              },
              {
                icon: DollarSign,
                title: "Hemat Biaya Operasional",
                description: "Minim antrian, minim kesalahan input, minim staff tambahan.",
                bgColor: "bg-blue-50",
                textColor: "text-blue-600",
              },
              {
                icon: Sparkles,
                title: "Pengalaman Pelanggan Lebih Modern",
                description: "Scan → Order → Bayar → Duduk santai.",
                bgColor: "bg-purple-50",
                textColor: "text-purple-600",
              },
              {
                icon: Server,
                title: "Sistem Stabil & Terukur",
                description: "Arsitektur cloud, multi-tenant, dan dapat menangani ratusan pesanan sekaligus.",
                bgColor: "bg-indigo-50",
                textColor: "text-indigo-600",
              },
              {
                icon: Smartphone,
                title: "Tanpa Install Aplikasi",
                description: "Semua berbasis web. Pelanggan hanya butuh kamera HP.",
                bgColor: "bg-pink-50",
                textColor: "text-pink-600",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
              >
                <div className={`mb-4 inline-flex rounded-xl ${item.bgColor} p-3 ${item.textColor}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
              Fitur Utama MejaOrder
            </h2>
            <p className="text-lg text-slate-600">
              Semua yang Anda butuhkan untuk mengelola cafe & resto dengan efisien
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: "QR Scan Ordering",
                description: "QR unik untuk setiap meja. Pelanggan langsung melihat menu tenant begitu scan.",
              },
              {
                icon: Menu,
                title: "Manajemen Menu & Variasi Lengkap",
                description: "Atur harga, stok, kategori, dan variasi (panas/dingin, level gula, topping, size) tanpa batasan.",
              },
              {
                icon: CreditCard,
                title: "Sistem Pembayaran Fleksibel",
                description: "Cash, Transfer Bank (upload bukti), dan QRIS yang tampil otomatis.",
              },
              {
                icon: Monitor,
                title: "Dashboard Kasir Real-time",
                description: "Pesanan masuk otomatis, verifikasi pembayaran, update status: pending → preparing → ready → completed.",
              },
              {
                icon: Table,
                title: "Kelola Meja & QR Code",
                description: "Tambah meja, edit nomor meja, download QR siap print.",
              },
              {
                icon: BarChart3,
                title: "Laporan Penjualan Otomatis",
                description: "Omzet harian/bulanan, menu paling laku, riwayat transaksi.",
              },
              {
                icon: Users,
                title: "Multi-User & Multi-Role",
                description: "Tenant Admin, Kasir, dan Super Admin (Platform Owner).",
              },
              {
                icon: Crown,
                title: "Subscription SaaS (Billing Friendly)",
                description: "Sistem otomatis cek subscription aktif. Tenant hanya aktif jika langganan valid.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
              Cara Kerja MejaOrder
            </h2>
            <p className="text-lg text-slate-600">
              Proses sederhana, hasil maksimal
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-5">
            {[
              {
                step: "1",
                title: "Pelanggan Duduk & Scan QR",
                description: "QR sudah ditempel di setiap meja.",
                icon: QrCode,
              },
              {
                step: "2",
                title: "Menu Digital Terbuka",
                description: "Pelanggan langsung pilih menu & variasi.",
                icon: Menu,
              },
              {
                step: "3",
                title: "Pembayaran Mudah",
                description: "Cash, Transfer, atau QRIS.",
                icon: CreditCard,
              },
              {
                step: "4",
                title: "Kasir Menerima Pesanan",
                description: "Dashboard real-time, tanpa delay.",
                icon: Monitor,
              },
              {
                step: "5",
                title: "Pesanan Disiapkan & Diantar",
                description: "Proses cepat, jelas, dan minim error.",
                icon: CheckCircle2,
              },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-2xl font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
                {idx < 4 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-full translate-x-1/2 bg-slate-200 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm">
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
              >
                Mulai Sekarang
              </Link>
            </div>

            {/* Pro Plan - Featured */}
            <div className="relative rounded-2xl border-2 border-emerald-500 bg-white p-8 shadow-xl">
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
              >
                Mulai Sekarang
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm">
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
              >
                Hubungi Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
              Testimoni Pengguna
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="mb-6 text-lg italic text-slate-700">
                "Antrean di kasir langsung hilang. Pelanggan tinggal scan dan pesan — omzet naik 35%."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-emerald-700">KS</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Owner Kopi Senja</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="mb-6 text-lg italic text-slate-700">
                "Kasir jadi lebih cepat, nggak ada lagi salah input. Sistemnya simple banget."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-blue-700">AB</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Resto Ayam Bakar Barokah</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration & Support Section */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
              Integrasi & Dukungan
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CreditCard, title: "QRIS siap pakai" },
              { icon: Printer, title: "Dukung printer thermal (opsional)" },
              { icon: Smartphone, title: "Bisa diakses dari HP, tablet, desktop" },
              { icon: Monitor, title: "Dashboard modern & mudah dipahami" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <div className="mb-4 flex justify-center">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Siap Meningkatkan Efisiensi Cafe & Resto Anda?
          </h2>
          <p className="mb-8 text-lg text-slate-300">
            Mulai sekarang juga dan rasakan perbedaannya
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30"
            >
              Coba Gratis 14 Hari
            </Link>
            <Link
              href="/demo"
              className="rounded-xl border-2 border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Jadwalkan Demo Dengan Tim Kami
            </Link>
          </div>
        </div>
      </section>

      <Footer variant="dark" />
    </div>
  );
}
