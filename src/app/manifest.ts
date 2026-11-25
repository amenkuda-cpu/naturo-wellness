import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Naturo Wellness",
    short_name: "Naturo Wellness",
    description: "Natural wellness shots, made fresh in Zimbabwe.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F7EFD6",
    theme_color: "#173F2B",
    lang: "en-ZW",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
