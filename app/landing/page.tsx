import type { Metadata } from "next";
import { LandingPageClient } from "./landing-client";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Landing Page - MejaOrder",
  description:
    "Pelajari lebih lanjut tentang MejaOrder, platform QR Ordering modern untuk cafe dan restoran. Lihat fitur, harga, dan cara kerja sistem kami.",
  keywords: [
    "mejaorder landing",
    "QR ordering platform",
    "sistem pemesanan cafe",
    "restaurant management",
  ],
  url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mejaorder.com"}/landing`,
});

export default function LandingPage() {
  return <LandingPageClient />;
}
