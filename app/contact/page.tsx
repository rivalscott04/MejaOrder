"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MessageSquare, ArrowLeft, Send, MapPin, Clock } from "lucide-react";
import { Footer } from "@/components/shared/footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    // Simulate form submission (replace with actual API call)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
            Hubungi Customer Service
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 px-4">
            Tim support kami siap membantu menjawab pertanyaan Anda. Kami akan merespons dalam waktu 24 jam.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="mb-5 sm:mb-6 text-lg sm:text-xl font-semibold text-slate-900">
                Informasi Kontak
              </h2>
              <div className="space-y-5 sm:space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900">Email</h3>
                    <a
                      href="mailto:support@mejaorder.com"
                      className="text-slate-600 transition hover:text-emerald-600 hover:underline"
                    >
                      support@mejaorder.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900">Telepon</h3>
                    <a
                      href="tel:+6281234567890"
                      className="text-slate-600 transition hover:text-emerald-600 hover:underline"
                    >
                      +62 812-3456-7890
                    </a>
                    <p className="mt-1 text-xs text-slate-500">
                      Senin - Jumat, 09:00 - 18:00 WIB
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900">Alamat</h3>
                    <p className="text-slate-600">
                      Jakarta, Indonesia
                    </p>
                  </div>
                </div>

                {/* Office Hours */}
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900">Jam Operasional</h3>
                    <p className="text-slate-600">
                      Senin - Jumat: 09:00 - 18:00 WIB
                    </p>
                    <p className="text-slate-600">
                      Sabtu: 09:00 - 15:00 WIB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="mt-5 sm:mt-6 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <h3 className="mb-2 text-sm sm:text-base font-semibold text-slate-900">
                Pertanyaan Umum?
              </h3>
              <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-slate-600">
                Cek halaman FAQ untuk jawaban cepat
              </p>
              <Link
                href="#"
                className="text-xs sm:text-sm font-medium text-emerald-600 transition hover:underline"
              >
                Lihat FAQ →
              </Link>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 md:p-8 shadow-sm">
              <h2 className="mb-5 sm:mb-6 text-lg sm:text-xl font-semibold text-slate-900">
                Kirim Pesan
              </h2>

              {submitStatus === "success" && (
                <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-sm font-medium text-emerald-800">
                    Pesan berhasil dikirim! Tim kami akan merespons dalam waktu 24 jam.
                  </p>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm font-medium text-red-800">
                    Terjadi kesalahan saat mengirim pesan. Silakan coba lagi atau hubungi kami langsung.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Subjek <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Pilih subjek</option>
                    <option value="general">Pertanyaan Umum</option>
                    <option value="technical">Masalah Teknis</option>
                    <option value="billing">Pertanyaan Billing</option>
                    <option value="feature">Permintaan Fitur</option>
                    <option value="partnership">Kemitraan</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Pesan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Tuliskan pesan Anda di sini..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Kirim Pesan
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

