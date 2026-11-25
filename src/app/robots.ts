import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or transactional pages: nothing here should appear in search results.
        disallow: ["/admin", "/rider", "/account", "/checkout", "/cart", "/order", "/api", "/auth", "/meta-pixel-bridge"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
