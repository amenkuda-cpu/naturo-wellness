/**
 * Public brand & contact configuration. Contact details and hours are from
 * Naturo's Facebook page (Nov 2026); each can be overridden with the matching
 * NEXT_PUBLIC_* env var.
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
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "077 297 2693",
    whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "+263 77 297 2693",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@getnaturo.com",
    address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Realtime Building, cnr Central Avenue & Third Street, Harare, Zimbabwe",
    /** Opens the address in maps (the kitchen's verified coordinates). */
    mapUrl: "https://www.google.com/maps/search/?api=1&query=-17.824752,31.051590",
    /** Messenger chat with the Naturo Wellness Facebook page. */
    messenger: process.env.NEXT_PUBLIC_CONTACT_MESSENGER || "https://m.me/61582299660104",
    hours: process.env.NEXT_PUBLIC_CONTACT_HOURS || "Mon–Fri 08:00–17:00 · Sat 09:00–13:00 · Sun closed",
  },
  /** Weekly opening hours, Harare time (Africa/Harare). Day 0 = Sunday. */
  openingHours: [
    { day: 1, label: "Monday", opens: "08:00", closes: "17:00" },
    { day: 2, label: "Tuesday", opens: "08:00", closes: "17:00" },
    { day: 3, label: "Wednesday", opens: "08:00", closes: "17:00" },
    { day: 4, label: "Thursday", opens: "08:00", closes: "17:00" },
    { day: 5, label: "Friday", opens: "08:00", closes: "17:00" },
    { day: 6, label: "Saturday", opens: "09:00", closes: "13:00" },
    { day: 0, label: "Sunday", opens: null, closes: null },
  ] as ReadonlyArray<{ day: number; label: string; opens: string | null; closes: string | null }>,
  social: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || null,
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "https://www.facebook.com/profile.php?id=61582299660104",
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
