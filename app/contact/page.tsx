import type { Metadata } from "next";
import { ContactPageClient } from "./contact-client";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Hubungi Kami - Customer Service MejaOrder",
  description:
    "Hubungi tim customer service MejaOrder untuk pertanyaan, dukungan teknis, atau informasi lebih lanjut tentang platform QR Ordering kami. Kami siap membantu Anda.",
  keywords: [
    "kontak mejaorder",
    "customer service mejaorder",
    "support mejaorder",
    "bantuan mejaorder",
    "hubungi mejaorder",
  ],
  url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mejaorder.com"}/contact`,
});

export default function ContactPage() {
  return <ContactPageClient />;
}
