import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { isVariantPurchasable } from "@/lib/commerce/pricing";
import type { Product } from "@/lib/types";

/**
 * Structured data (schema.org JSON-LD). Everything here comes from real site data:
 * no reviews or ratings are published because none exist in the system yet.
 */

const abs = (path: string) => (path.startsWith("http") ? path : `${siteConfig.url}${path}`);
export const ORG_ID = `${siteConfig.url}/#organization`;
export const STORE_ID = `${siteConfig.url}/#store`;
export const WEBSITE_ID = `${siteConfig.url}/#website`;

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Organization + Store + WebSite, published on every page. */
export function siteGraph() {
  const address = {
    "@type": "PostalAddress",
    streetAddress: brand.address.streetAddress,
    addressLocality: brand.address.addressLocality,
    addressRegion: brand.address.addressRegion,
    ...(brand.address.postalCode ? { postalCode: brand.address.postalCode } : {}),
    addressCountry: brand.address.addressCountry,
  };
  const contactPoint = {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: brand.whatsappE164,
    url: brand.whatsappUrl,
    availableLanguage: ["English", "Shona"],
    areaServed: "ZW",
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: brand.name,
        alternateName: [brand.alternateName, brand.disambiguator],
        ...(brand.legalName ? { legalName: brand.legalName } : {}),
        ...(brand.foundingDate ? { foundingDate: brand.foundingDate } : {}),
        url: siteConfig.url,
        logo: { "@type": "ImageObject", url: abs(brand.logo), width: 644, height: 626 },
        image: abs(brand.shareImage.src),
        description: `${brand.name} makes natural wellness shots, made fresh in Harare, Zimbabwe.`,
        slogan: siteConfig.tagline,
        founder: { "@type": "Person", name: brand.founder.name, jobTitle: brand.founder.jobTitle },
        areaServed: { "@type": "Country", name: "Zimbabwe" },
        address,
        contactPoint,
        sameAs: brand.sameAs(),
      },
      {
        "@type": ["Store", "LocalBusiness"],
        "@id": STORE_ID,
        name: brand.name,
        url: siteConfig.url,
        image: abs(brand.shareImage.src),
        logo: abs(brand.logo),
        telephone: brand.whatsappE164,
        ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
        priceRange: "$",
        currenciesAccepted: "USD",
        address,
        geo: { "@type": "GeoCoordinates", latitude: brand.geo.latitude, longitude: brand.geo.longitude },
        hasMap: siteConfig.contact.mapUrl,
        areaServed: { "@type": "Country", name: "Zimbabwe" },
        parentOrganization: { "@id": ORG_ID },
        openingHoursSpecification: siteConfig.openingHours
          .filter((h) => h.opens && h.closes)
          .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: days[h.day], opens: h.opens, closes: h.closes })),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: brand.name,
        alternateName: [brand.alternateName, "getnaturo.com"],
        url: siteConfig.url,
        inLanguage: "en-ZW",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function productLd(product: Product, description: string, categoryName: string) {
  const url = abs(`/shop/${product.slug}`);
  const priced = product.variants.filter((v) => v.price !== null);
  const availability = (v: Product["variants"][number]) =>
    v.stockStatus === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : isVariantPurchasable(product, v)
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder";
  const offer = (v: Product["variants"][number]) => ({
    "@type": "Offer",
    url,
    price: (v.price! / 100).toFixed(2),
    priceCurrency: product.currency,
    availability: availability(v),
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Zimbabwe" },
  });
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: `${product.name} by Naturo Wellness`,
    description,
    url,
    image: product.images.map((i) => abs(i.src)),
    ...(priced[0]?.sku ? { sku: priced[0].sku } : { sku: product.id }),
    brand: { "@type": "Brand", name: brand.name },
    manufacturer: { "@id": ORG_ID },
    category: categoryName,
    countryOfOrigin: "ZW",
    ...(priced.length === 1 ? { offers: offer(priced[0]) } : priced.length > 1 ? { offers: priced.map(offer) } : {}),
  };
}

export function articleLd(a: { title: string; description: string; path: string; image: string; datePublished: string; dateModified?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    url: abs(a.path),
    mainEntityOfPage: abs(a.path),
    image: abs(a.image),
    datePublished: a.datePublished,
    dateModified: a.dateModified ?? a.datePublished,
    author: { "@type": "Organization", name: brand.name, url: siteConfig.url },
    publisher: { "@id": ORG_ID },
    inLanguage: "en-ZW",
  };
}
