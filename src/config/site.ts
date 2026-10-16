/**
 * Public brand & contact configuration.
 *
 * Contact details are deliberately PLACEHOLDERS. Fill these in (or set the
 * matching NEXT_PUBLIC_* env vars) with verified details before launch.
 * Anything left as `null` is hidden or shown as "to be confirmed" in the UI,
 * and is never published in structured data.
 */
export const siteConfig = {
  name: "Naturo Wellness",
  shortName: "Naturo",
  tagline: "Feel good. Naturally.",
  mission: "To make everyday wellness natural, affordable and proudly Zimbabwean.",
  description:
    "Naturo Wellness makes natural wellness shots, traditional Zimbabwean favourites and herbal blends, proudly made in Zimbabwe.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  country: "Zimbabwe",
  contact: {
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || null,
    whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || null,
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
    address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || null,
    hours: process.env.NEXT_PUBLIC_CONTACT_HOURS || null,
  },
  social: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || null,
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || null,
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || null,
  },
  /** Optional promotional banner, e.g. "Free delivery in Harare this week". */
  announcement: process.env.NEXT_PUBLIC_ANNOUNCEMENT || null,
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/our-story", label: "Our Story" },
  { href: "/ingredients", label: "Our Ingredients" },
  { href: "/contact", label: "Contact" },
] as const;
