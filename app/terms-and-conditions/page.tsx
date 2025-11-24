import type { Metadata } from "next";
import { TermsAndConditionsClient } from "./terms-client";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Syarat dan Ketentuan - MejaOrder",
  description:
    "Baca syarat dan ketentuan penggunaan platform MejaOrder. Ketahui hak dan kewajiban Anda sebagai pengguna layanan QR Ordering kami.",
  keywords: [
    "syarat dan ketentuan mejaorder",
    "terms and conditions",
    "kebijakan mejaorder",
    "aturan penggunaan",
  ],
  url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mejaorder.com"}/terms-and-conditions`,
});

export default function TermsAndConditionsPage() {
  return <TermsAndConditionsClient />;
}
