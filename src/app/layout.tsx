import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Outfit } from "next/font/google";
import { metaPixel } from "@/config/meta";
import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  // Variable font with the width axis: the home hero headline uses the condensed cut (wdth 75).
  axes: ["wdth"],
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});
const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Naturo Wellness | Natural Wellness Shots in Zimbabwe",
    template: "%s | Naturo Wellness",
  },
  description:
    "Naturo Wellness makes natural wellness shots, made fresh in Harare, Zimbabwe. Ginger, Men's, Hibiscus, Glow and Pineapple. Order online or on WhatsApp.",
  applicationName: brand.name,
  authors: [{ name: brand.name, url: siteConfig.url }],
  creator: brand.name,
  publisher: brand.name,
  // Meta domain verification (Business Manager → Brand safety → Domains) and Search Console / Bing.
  other: {
    ...(metaPixel.domainVerification ? { "facebook-domain-verification": metaPixel.domainVerification } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : {}),
  },
  // TODO(Naturo): paste the Google Search Console HTML-tag token into NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
  openGraph: {
    type: "website",
    siteName: brand.name,
    locale: "en_ZW",
    url: "/",
    title: "Naturo Wellness | Natural Wellness Shots in Zimbabwe",
    description: "Natural wellness shots, made fresh in Harare, Zimbabwe. Order online or on WhatsApp.",
    images: [{ url: brand.shareImage.src, width: brand.shareImage.width, height: brand.shareImage.height, alt: brand.shareImage.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Naturo Wellness | Natural Wellness Shots in Zimbabwe",
    description: "Natural wellness shots, made fresh in Harare, Zimbabwe.",
    images: [brand.shareImage.src],
  },
  // Icons come from the file conventions: app/favicon.ico, app/icon.png and app/apple-icon.png.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#173F2B",
  width: "device-width",
  initialScale: 1,
};

const motionScript = `try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('motion-ok')}}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-ZW"
      className={`${display.variable} ${serif.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
