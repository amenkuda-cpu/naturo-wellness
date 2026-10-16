import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getCatalog } from "@/lib/commerce/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const pages = ["", "/shop", "/our-story", "/ingredients", "/contact", "/faq", "/delivery", "/privacy", "/terms", "/returns"];
  const catalog = await getCatalog();
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...catalog.map((p) => ({
      url: `${base}/shop/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images.map((i) => `${base}${i.src}`),
    })),
  ];
}
