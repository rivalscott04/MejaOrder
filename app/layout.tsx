import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MejaOrder | Solusi QR Ordering Modern untuk Cafe & Resto",
  description:
    "Revolusi Pemesanan Cafe & Resto — Langsung dari Meja Pelanggan. Dengan MejaOrder, pelanggan cukup scan QR, pilih menu, bayar, dan pesanan otomatis masuk ke sistem. Cepat, modern, dan tanpa antre.",
  icons: {
    icon: "/favico.png",
    shortcut: "/favico.png",
    apple: "/favico.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--bg-soft)]`}
      >
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
