"use client";

import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/shared/footer";

export function TermsAndConditionsClient() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-emerald-600"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 flex-shrink-0">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
              Syarat dan Ketentuan
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 sm:space-y-8 text-sm sm:text-base text-slate-700">
          {/* Section 1 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              1. Penerimaan Syarat dan Ketentuan
            </h2>
            <p className="mb-3 sm:mb-4 leading-relaxed">
              Dengan mengakses dan menggunakan layanan MejaOrder, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat dan ketentuan ini, Anda tidak boleh menggunakan layanan kami.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              2. Definisi
            </h2>
            <ul className="mb-3 sm:mb-4 list-disc space-y-2 pl-5 sm:pl-6 leading-relaxed text-sm sm:text-base">
              <li>
                <strong>MejaOrder</strong> adalah platform layanan pemesanan makanan dan minuman berbasis QR Code untuk cafe dan restoran.
              </li>
              <li>
                <strong>Pengguna</strong> adalah individu atau entitas yang menggunakan layanan MejaOrder, baik sebagai pemilik bisnis (Tenant) maupun pelanggan.
              </li>
              <li>
                <strong>Tenant</strong> adalah pemilik atau pengelola cafe/restoran yang menggunakan platform MejaOrder untuk mengelola pemesanan.
              </li>
              <li>
                <strong>Pelanggan</strong> adalah individu yang melakukan pemesanan melalui platform MejaOrder.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              3. Penggunaan Layanan
            </h2>
            <div className="mb-4 space-y-3 leading-relaxed">
              <p>
                <strong>3.1. Akun Pengguna</strong>
              </p>
              <p>
                Untuk menggunakan layanan MejaOrder sebagai Tenant, Anda harus membuat akun dengan informasi yang akurat dan lengkap. Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda.
              </p>
              <p>
                <strong>3.2. Kepatuhan Hukum</strong>
              </p>
              <p>
                Anda setuju untuk menggunakan layanan MejaOrder sesuai dengan semua hukum dan peraturan yang berlaku, serta tidak menggunakan layanan untuk tujuan yang melanggar hukum.
              </p>
              <p>
                <strong>3.3. Larangan</strong>
              </p>
              <p>
                Anda dilarang untuk:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Menggunakan layanan untuk aktivitas ilegal atau tidak sah</li>
                <li>Mengganggu atau merusak sistem atau keamanan platform</li>
                <li>Menggunakan akun orang lain tanpa izin</li>
                <li>Mengunggah konten yang melanggar hak cipta atau hak kekayaan intelektual</li>
                <li>Melakukan tindakan yang dapat merugikan pengguna lain</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              4. Pembayaran dan Langganan
            </h2>
            <div className="mb-4 space-y-3 leading-relaxed">
              <p>
                <strong>4.1. Biaya Langganan</strong>
              </p>
              <p>
                MejaOrder menawarkan berbagai paket langganan dengan biaya bulanan. Harga dapat berubah sewaktu-waktu dengan pemberitahuan sebelumnya kepada pengguna aktif.
              </p>
              <p>
                <strong>4.2. Metode Pembayaran</strong>
              </p>
              <p>
                Pembayaran dapat dilakukan melalui berbagai metode yang tersedia, termasuk transfer bank, QRIS, dan metode pembayaran digital lainnya. Kami bekerja sama dengan penyedia payment gateway terpercaya untuk memastikan keamanan transaksi.
              </p>
              <p>
                <strong>4.3. Pembatalan dan Pengembalian</strong>
              </p>
              <p>
                Anda dapat membatalkan langganan kapan saja. Pembayaran yang sudah dilakukan untuk periode berjalan tidak dapat dikembalikan, kecuali diatur lain dalam kebijakan pengembalian dana kami.
              </p>
              <p>
                <strong>4.4. Pembayaran yang Gagal</strong>
              </p>
              <p>
                Jika pembayaran langganan gagal, akses ke layanan dapat ditangguhkan hingga pembayaran berhasil dilakukan.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              5. Transaksi Pemesanan
            </h2>
            <div className="mb-4 space-y-3 leading-relaxed">
              <p>
                <strong>5.1. Pemesanan oleh Pelanggan</strong>
              </p>
              <p>
                Pelanggan dapat melakukan pemesanan melalui QR Code yang tersedia di meja. Setiap pemesanan yang dilakukan dianggap sebagai komitmen untuk membayar sesuai dengan total yang tertera.
              </p>
              <p>
                <strong>5.2. Pembayaran Pesanan</strong>
              </p>
              <p>
                Pembayaran pesanan dapat dilakukan melalui metode yang tersedia: tunai, transfer bank, atau QRIS. Verifikasi pembayaran dilakukan oleh Tenant atau kasir yang berwenang.
              </p>
              <p>
                <strong>5.3. Pembatalan Pesanan</strong>
              </p>
              <p>
                Pembatalan pesanan dapat dilakukan sesuai dengan kebijakan masing-masing Tenant. MejaOrder tidak bertanggung jawab atas kebijakan pembatalan yang ditetapkan oleh Tenant.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              6. Hak Kekayaan Intelektual
            </h2>
            <p className="mb-4 leading-relaxed">
              Semua konten, fitur, dan fungsi yang tersedia di platform MejaOrder, termasuk namun tidak terbatas pada teks, grafik, logo, ikon, gambar, dan perangkat lunak, adalah milik MejaOrder atau pemberi lisensinya dan dilindungi oleh undang-undang hak cipta dan kekayaan intelektual.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              7. Privasi dan Data
            </h2>
            <p className="mb-4 leading-relaxed">
              Penggunaan data pribadi Anda diatur oleh Kebijakan Privasi kami. Dengan menggunakan layanan MejaOrder, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan Kebijakan Privasi tersebut.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              8. Batasan Tanggung Jawab
            </h2>
            <div className="mb-4 space-y-3 leading-relaxed">
              <p>
                MejaOrder menyediakan platform sebagai layanan. Kami tidak bertanggung jawab atas:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Kualitas makanan atau minuman yang dipesan melalui platform</li>
                <li>Keterlambatan atau kegagalan pengiriman pesanan</li>
                <li>Masalah yang timbul antara Tenant dan Pelanggan</li>
                <li>Kerugian yang timbul akibat penggunaan atau ketidakmampuan menggunakan layanan</li>
                <li>Gangguan teknis yang di luar kendali kami</li>
              </ul>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              9. Perubahan Layanan
            </h2>
            <p className="mb-4 leading-relaxed">
              MejaOrder berhak untuk mengubah, menangguhkan, atau menghentikan layanan atau bagian dari layanan kapan saja tanpa pemberitahuan sebelumnya. Kami tidak bertanggung jawab kepada Anda atau pihak ketiga atas perubahan, penangguhan, atau penghentian layanan tersebut.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              10. Pengakhiran
            </h2>
            <p className="mb-4 leading-relaxed">
              Kami berhak untuk menangguhkan atau mengakhiri akses Anda ke layanan kapan saja, dengan atau tanpa alasan, termasuk namun tidak terbatas pada pelanggaran syarat dan ketentuan ini.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              11. Perubahan Syarat dan Ketentuan
            </h2>
            <p className="mb-4 leading-relaxed">
              Kami berhak untuk mengubah syarat dan ketentuan ini kapan saja. Perubahan akan berlaku efektif setelah dipublikasikan di platform. Penggunaan berkelanjutan layanan setelah perubahan tersebut dianggap sebagai persetujuan Anda terhadap syarat dan ketentuan yang baru.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              12. Hukum yang Berlaku
            </h2>
            <p className="mb-4 leading-relaxed">
              Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui pengadilan yang berwenang di Indonesia.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-slate-900">
              13. Kontak
            </h2>
            <p className="mb-4 leading-relaxed">
              Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami melalui halaman <Link href="/contact" className="text-emerald-600 hover:underline">Kontak</Link> atau email ke support@mejaorder.com.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-8 sm:mt-12 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 text-center">
          <h3 className="mb-2 text-lg sm:text-xl font-semibold text-slate-900">
            Masih Ada Pertanyaan?
          </h3>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base text-slate-600">
            Tim customer service kami siap membantu Anda
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-xl bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600"
            aria-label="Hubungi Kami"
          >
            Hubungi Kami
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

