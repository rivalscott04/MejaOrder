import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mejaorder.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/cashier/",
          "/tenant-admin/",
          "/super-admin/",
          "/login",
          "/register",
          "/payment/callback",
          "/o/*/t/*/order/*", // Order detail pages (private)
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/cashier/",
          "/tenant-admin/",
          "/super-admin/",
          "/login",
          "/register",
          "/payment/callback",
          "/o/*/t/*/order/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}









