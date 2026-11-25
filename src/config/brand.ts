import { siteConfig } from "@/config/site";

/**
 * Brand facts used for SEO copy and structured data (JSON-LD).
 * Only confirmed facts live here. Anything still unknown is null and marked TODO:
 * the site simply leaves it out until it is filled in (never invent values).
 */
export const brand = {
  name: "Naturo Wellness",
  alternateName: "Naturo",
  /** Always pair "Naturo" with "Wellness" or "Zimbabwe" so search engines can tell us apart. */
  disambiguator: "Naturo Wellness Zimbabwe",
  founder: { name: "Sharon Ndoro Nyazema", jobTitle: "Founder and Director" },
  vision: "To become a trusted African wellness brand, rooted in Zimbabwe and made for everyday life.",
  /** Private limited company in Harare. Registration is in progress, so no legal name or number is claimed yet. */
  legalName: null as string | null, // TODO(Naturo): add the registered company name once registration is complete.
  foundingDate: null as string | null, // TODO(Naturo): year the business started, e.g. "2025".
  /** WhatsApp only. There are no call buttons on the site. */
  whatsappE164: `+${siteConfig.contact.whatsapp.replace(/\D/g, "")}`,
  whatsappUrl: `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`,
  address: {
    streetAddress: "Realtime Building, cnr Central Avenue & Third Street",
    addressLocality: "Harare",
    addressRegion: "Harare", // province
    postalCode: null as string | null, // TODO(Naturo): Zimbabwe has no postcodes in common use; leave null unless you have one.
    addressCountry: "ZW",
  },
  geo: { latitude: -17.824752, longitude: 31.05159 },
  logo: "/images/brand/naturo-wellness-logo.png",
  shareImage: { src: "/og/naturo-wellness-share.jpg", width: 1200, height: 630, alt: "Naturo Wellness natural wellness shots, made fresh in Zimbabwe" },
  /**
   * Every official profile. Use the exact name "Naturo Wellness" on each one.
   * TODO(Naturo): add the Instagram, TikTok, LinkedIn and Google Business Profile URLs
   * (set NEXT_PUBLIC_SOCIAL_INSTAGRAM / NEXT_PUBLIC_SOCIAL_TIKTOK, or edit src/config/site.ts).
   */
  sameAs: () =>
    [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.tiktok,
      process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || null, // TODO(Naturo): LinkedIn company page
      process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL || null, // TODO(Naturo): Google Business Profile link (after verification)
    ].filter((u): u is string => Boolean(u)),
} as const;

/** "Natural wellness shots, made fresh in Zimbabwe": the one-line positioning used across the site. */
export const positioning = "Natural wellness shots, made fresh in Zimbabwe";
