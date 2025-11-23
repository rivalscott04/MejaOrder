import Link from "next/link";
import { Mail, QrCode, Github, Twitter, Linkedin } from "lucide-react";

type FooterProps = {
  variant?: "default" | "dark";
};

export function Footer({ variant = "default" }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const isDark = variant === "dark";

  return (
    <footer
      className={
        isDark
          ? "border-t border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
          : "border-t border-slate-200 bg-white"
      }
    >
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand Section */}
          <div className="sm:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <span className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                MejaOrder
              </span>
            </div>
            <p className={`mb-4 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Solusi QR Ordering Modern untuk Cafe & Resto. Tingkatkan omzet, kurangi antrian, dan percepat layanan.
            </p>
            <div className={`flex items-center gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              <Mail className="h-4 w-4" />
              <a
                href="mailto:support@mejaorder.com"
                className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                support@mejaorder.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`mb-4 font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              Tautan Cepat
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/demo"
                  className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Demo
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Daftar
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Masuk
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className={`mb-4 font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              Sumber Daya
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Dokumentasi
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Panduan
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  FAQ
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Kontak
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  className={`transition hover:text-emerald-400 hover:underline ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-8 border-t ${isDark ? "border-white/10" : "border-slate-200"} pt-8`}>
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                © {currentYear} MejaOrder. Hak cipta dilindungi.
              </p>
              <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Sistem Pemesanan QR untuk Cafe & Resto
              </p>
              <div
                className={`mt-2 flex flex-wrap justify-center gap-4 text-xs md:justify-start ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                <Link
                  href="/terms-and-conditions"
                  className="transition hover:text-emerald-400 hover:underline"
                >
                  Syarat & Ketentuan
                </Link>
                <span>•</span>
                <Link
                  href="/contact"
                  className="transition hover:text-emerald-400 hover:underline"
                >
                  Kontak
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className={`transition hover:text-emerald-400 ${isDark ? "text-slate-400" : "text-slate-400"}`}
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className={`transition hover:text-emerald-400 ${isDark ? "text-slate-400" : "text-slate-400"}`}
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className={`transition hover:text-emerald-400 ${isDark ? "text-slate-400" : "text-slate-400"}`}
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

