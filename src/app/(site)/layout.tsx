import Script from "next/script";
import { Suspense } from "react";
import { MetaPixelEvents } from "@/components/analytics/meta-pixel";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { HeaderFallback } from "@/components/layout/header-fallback";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { StoreProvider } from "@/components/providers/store-provider";
import { JsonLd } from "@/components/seo/json-ld";
import { metaPixel } from "@/config/meta";
import { siteConfig } from "@/config/site";
import { getCatalog, getStoreSettings } from "@/lib/commerce/catalog";
import { env } from "@/lib/env";
import { pixelBaseCode } from "@/lib/meta-pixel-snippet";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [catalog, settings] = await Promise.all([getCatalog(), getStoreSettings()]);

  // Business data from Naturo's own published details (address, phone, hours).
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const organisation = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/brand/naturo-wellness-logo.png`,
    image: `${siteConfig.url}/images/brand/naturo-wellness-logo.png`,
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
    ...(siteConfig.contact.phone ? { telephone: "+263 77 297 2693" } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Realtime Building, cnr Central Avenue & Third Street",
      addressLocality: "Harare",
      addressCountry: "ZW",
    },
    geo: { "@type": "GeoCoordinates", latitude: -17.824752, longitude: 31.05159 },
    openingHoursSpecification: siteConfig.openingHours
      .filter((h) => h.opens && h.closes)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: days[h.day], opens: h.opens, closes: h.closes })),
    sameAs: Object.values(siteConfig.social).filter(Boolean),
  };

  return (
    <StoreProvider catalog={catalog} settings={settings}>
      <JsonLd data={organisation} />
      {/* These read the URL; Suspense keeps dynamic routes prerenderable. */}
      <Suspense fallback={null}>
        <SmoothScroll />
      </Suspense>
      <Suspense fallback={<HeaderFallback />}>
        <Header showAccount={env.supabase.authConfigured} />
      </Suspense>
      <main id="main">{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
      <Suspense fallback={null}>
        <WhatsAppFloat />
      </Suspense>
      {metaPixel.enabled && (
        <>
          {/* Meta Pixel base code (skips /order, /admin and /rider: see config/meta.ts). */}
          <Script id="meta-pixel" strategy="afterInteractive">
            {pixelBaseCode()}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${metaPixel.id}&ev=PageView&noscript=1`} />
          </noscript>
          <Suspense fallback={null}>
            <MetaPixelEvents />
          </Suspense>
        </>
      )}
    </StoreProvider>
  );
}
