import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { articles } from "@/data/journal";
import { SHOT_SLUGS } from "@/data/product-copy";
import { getCatalog } from "@/lib/commerce/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/shop", priority: 0.9 },
    { path: "/our-story", priority: 0.7 },
    { path: "/faq", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/journal", priority: 0.6 },
    { path: "/ingredients", priority: 0.5 },
    { path: "/delivery", priority: 0.5 },
    { path: "/returns", priority: 0.2 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
  ];
  const catalog = await getCatalog();
  const shots = new Set<string>(SHOT_SLUGS);
  return [
    ...pages.map((p) => ({ url: `${base}${p.path}`, changeFrequency: "weekly" as const, priority: p.priority })),
    ...catalog
      .filter((p) => p.enabledForSale)
      .map((p) => ({
        url: `${base}/shop/${p.slug}`,
        changeFrequency: "weekly" as const,
        priority: shots.has(p.slug) ? 0.9 : 0.6,
        images: p.images.map((i) => `${base}${i.src}`),
      })),
    ...articles.map((a) => ({
      url: `${base}/journal/${a.slug}`,
      lastModified: new Date(a.datePublished),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
