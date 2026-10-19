import { Suspense } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { DevNotice } from "@/components/layout/dev-notice";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { HeaderFallback } from "@/components/layout/header-fallback";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { StoreProvider } from "@/components/providers/store-provider";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { getCatalog, getStoreSettings } from "@/lib/commerce/catalog";
import { env } from "@/lib/env";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [catalog, settings] = await Promise.all([getCatalog(), getStoreSettings()]);

  // Organisation data uses only verified fields: no invented address/phone.
  const organisation = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/brand/naturo-wellness-logo.png`,
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
    ...(siteConfig.contact.phone ? { telephone: siteConfig.contact.phone } : {}),
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
      <DevNotice samplePricing={settings.samplePricing} dataSource={settings.dataSource} />
    </StoreProvider>
  );
}
