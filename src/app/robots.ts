import type { MetadataRoute } from "next";
import { company } from "@/config/company";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = company.site.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Служебные адреса и разметка рекламных меток в индексе не нужны
        disallow: ["/api/", "/*?utm_", "/*?yclid", "/*?gclid"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
