import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mejaorder.com";
const siteName = "MejaOrder";

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  nofollow?: boolean;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const title = config.title
    ? `${config.title} | ${siteName}`
    : `${siteName} | Solusi QR Ordering Modern untuk Cafe & Resto`;
  const description =
    config.description ||
    "Revolusi Pemesanan Cafe & Resto — Langsung dari Meja Pelanggan. Dengan MejaOrder, pelanggan cukup scan QR, pilih menu, bayar, dan pesanan otomatis masuk ke sistem. Cepat, modern, dan tanpa antre.";
  const url = config.url || siteUrl;
  const image = config.image || `${siteUrl}/og-image.jpg`;
  
  // Next.js only supports "website" or "article" for OpenGraph type
  // Convert "product" to "website"
  const openGraphType = config.type === "product" ? "website" : (config.type || "website");

  return {
    title,
    description,
    keywords: config.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: openGraphType as "website" | "article",
      locale: "id_ID",
      url,
      siteName,
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: !config.noindex,
      follow: !config.nofollow,
      googleBot: {
        index: !config.noindex,
        follow: !config.nofollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MejaOrder",
    url: siteUrl,
    logo: `${siteUrl}/favico.png`,
    description:
      "Platform QR Ordering modern untuk cafe dan restoran. Sistem pemesanan digital yang memudahkan pelanggan dan pemilik bisnis.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+62-812-3456-7890",
      contactType: "Customer Service",
      areaServed: "ID",
      availableLanguage: ["Indonesian"],
    },
    sameAs: [
      // Add social media links here when available
      // "https://www.facebook.com/mejaorder",
      // "https://www.instagram.com/mejaorder",
      // "https://twitter.com/mejaorder",
    ],
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  price: string;
  currency?: string;
  image?: string;
  availability?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image || `${siteUrl}/og-image.jpg`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "IDR",
      availability: product.availability || "https://schema.org/InStock",
    },
  };
}

export function generateServiceSchema(service: {
  name: string;
  description: string;
  provider: string;
  areaServed?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    provider: {
      "@type": "Organization",
      name: service.provider,
    },
    areaServed: {
      "@type": "Country",
      name: service.areaServed || "Indonesia",
    },
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

