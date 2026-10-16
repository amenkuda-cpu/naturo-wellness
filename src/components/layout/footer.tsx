import { cacheLife } from "next/cache";
import Link from "next/link";
import { NaturoMark } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { categories } from "@/data/products";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      ...categories.map((c) => ({ href: `/shop?category=${c.id}`, label: c.name })),
    ],
  },
  {
    title: "Naturo",
    links: [
      { href: "/our-story", label: "Our story" },
      { href: "/ingredients", label: "Our ingredients" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQs" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/delivery", label: "Delivery information" },
      { href: "/returns", label: "Refunds & returns" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms & conditions" },
    ],
  },
];

export function Footer() {
  const { contact, social } = siteConfig;
  const socials = Object.entries(social).filter(([, url]) => Boolean(url)) as [string, string][];
  return (
    <footer className="cv-auto relative isolate overflow-hidden bg-forest text-warm">
      <div className="container-x grid gap-12 pb-10 pt-20 lg:grid-cols-12 lg:pt-28">
        <div className="lg:col-span-4">
          <NaturoMark className="h-14 w-14 text-sun" />
          <p className="serif-accent mt-6 max-w-sm text-3xl leading-tight text-citrus">
            Everyday wellness, rooted in nature. Proudly Zimbabwean.
          </p>
          <p className="mt-4 max-w-sm text-sm text-warm/65">{siteConfig.mission}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-5">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="eyebrow text-sun">{col.title}</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-underline text-warm/80 hover:text-warm">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="lg:col-span-3">
          <h2 className="eyebrow text-sun">Get in touch</h2>
          <ul className="mt-5 space-y-3 text-sm text-warm/80">
            {contact.phone ? (
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="link-underline">{contact.phone}</a>
              </li>
            ) : null}
            {contact.whatsapp ? (
              <li>
                <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} className="link-underline" rel="noopener" target="_blank">
                  WhatsApp us
                </a>
              </li>
            ) : null}
            {contact.email ? (
              <li>
                <a href={`mailto:${contact.email}`} className="link-underline">{contact.email}</a>
              </li>
            ) : null}
            {!contact.phone && !contact.email && !contact.whatsapp && (
              <li className="text-warm/60">Contact details coming soon.</li>
            )}
            <li className="text-warm/60">Made in {siteConfig.country}</li>
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-3">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-10 items-center rounded-full border border-warm/25 px-4 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-warm hover:text-forest"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <svg aria-hidden viewBox="0 0 1000 230" className="pointer-events-none -mb-[2%] block w-full select-none">
        <text x="500" y="200" textAnchor="middle" className="fill-warm/[0.06] font-display" fontSize="300" fontWeight="800" letterSpacing="-18">
          Naturo
        </text>
      </svg>

      <div className="border-t border-warm/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-warm/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> Naturo Wellness. All rights reserved.
          </p>
          <p>Our products are not intended to diagnose, treat, cure or prevent any disease.</p>
        </div>
      </div>
    </footer>
  );
}
