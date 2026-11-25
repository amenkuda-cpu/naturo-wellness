import Script from "next/script";
import { Suspense } from "react";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
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
import { getCatalog, getStoreSettings } from "@/lib/commerce/catalog";
import { env } from "@/lib/env";
import { pixelBaseCode } from "@/lib/meta-pixel-snippet";
import { siteGraph } from "@/lib/seo/schema";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [catalog, settings] = await Promise.all([getCatalog(), getStoreSettings()]);

  return (
    <StoreProvider catalog={catalog} settings={settings}>
      {/* Organization, Store and WebSite schema on every page (see lib/seo/schema.ts). */}
      <JsonLd data={siteGraph()} />
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
      <Suspense fallback={null}>
        <GoogleAnalytics />
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
