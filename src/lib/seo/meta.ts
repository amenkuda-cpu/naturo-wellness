import type { Metadata } from "next";
import { brand } from "@/config/brand";

/**
 * Full per-page metadata: title, description, canonical, Open Graph and Twitter card.
 * (A page's openGraph replaces the site-wide one entirely, so every page sets all of it here.)
 */
export function pageMeta({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  image?: { url: string; width: number; height: number; alt: string };
  type?: "website" | "article";
}): Metadata {
  const share = { url: brand.shareImage.src, width: brand.shareImage.width, height: brand.shareImage.height, alt: brand.shareImage.alt };
  const images = image ? [image, share] : [share];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { type, url: path, siteName: brand.name, locale: "en_ZW", title, description, images },
    twitter: { card: "summary_large_image", title, description, images: [share.url] },
  };
}
