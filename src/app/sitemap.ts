import type { MetadataRoute } from "next";
import { company } from "@/config/company";
import { landings } from "@/config/landings";
import { priceUpdatedAt } from "@/config/prices";

/**
 * sitemap.xml собирается из конфига посадочных страниц: добавили лендинг —
 * он появился в карте сайта сам, без ручной правки.
 *
 * lastModified привязан к дате прайса: цены — это то, что реально меняется
 * на этих страницах, и переобход по ним имеет смысл.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = company.site.url.replace(/\/$/, "");
  const lastModified = new Date(`${priceUpdatedAt}T00:00:00Z`);

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...landings.map((landing) => ({
      url: `${siteUrl}/${landing.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: landing.priority,
    })),
    {
      url: `${siteUrl}/politika-konfidencialnosti`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.1,
    },
  ];
}
